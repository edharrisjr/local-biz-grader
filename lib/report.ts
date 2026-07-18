import { getPlaceDetails } from "./google-places";
import { getPageSpeed } from "./pagespeed";
import { detectOrderingSignals } from "./ordering";
import { buildCompetitorRanking } from "./competitors";
import { getSearchRanking } from "./serper";
import { buildCategoryScores, computeOverallScore, scoreToGrade } from "./scoring";
import type { Report, ReportInput } from "./types";

/** Prevents a slow third-party site from stalling the whole report. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function buildReport(input: ReportInput): Promise<Report> {
  const errors: string[] = [];

  const place = await getPlaceDetails(input.placeId).catch((err) => {
    errors.push(`Google Places lookup failed: ${err.message}`);
    return null;
  });

  const [pageSpeed, ordering, competitorRanking, searchRanking] = await Promise.all([
    place?.website
      ? withTimeout(
          getPageSpeed(place.website),
          15000,
          { performanceScore: null, mobileFriendly: null, fetched: false }
        )
      : Promise.resolve(null),
    withTimeout(
      detectOrderingSignals(place?.website),
      8000,
      {
        hasWebsite: Boolean(place?.website),
        detectedPlatforms: [],
        hasOnlineOrdering: false,
        hasReservations: false,
      }
    ),
    place
      ? withTimeout(buildCompetitorRanking(input.placeId, place), 8000, null)
      : Promise.resolve(null),
    place && input.city
      ? withTimeout(
          getSearchRanking(place.name, place.website, place.primaryCategory ?? "business", input.city),
          8000,
          null
        )
      : Promise.resolve(null),
  ]);

  const categories = buildCategoryScores(place, pageSpeed, ordering);
  const overallScore = computeOverallScore(categories);

  return {
    input,
    place,
    pageSpeed,
    ordering,
    competitorRanking,
    searchRanking,
    categories,
    overallScore,
    grade: scoreToGrade(overallScore),
    errors,
  };
}
