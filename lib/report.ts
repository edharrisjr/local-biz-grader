import { getPlaceDetails } from "./google-places";
import { getPageSpeed } from "./pagespeed";
import { detectOrderingSignals } from "./ordering";
import { fetchWebsiteHtml } from "./website-html";
import { analyzeWebsite } from "./website-checklist";
import { buildCompetitorRanking } from "./competitors";
import { getSearchRankings } from "./serper";
import { buildReportSections } from "./scoring-sections";
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

  const [pageSpeed, html, competitorRanking, searchRankings] = await Promise.all([
    place?.website
      ? withTimeout(
          getPageSpeed(place.website),
          15000,
          { performanceScore: null, mobileFriendly: null, fetched: false }
        )
      : Promise.resolve(null),
    withTimeout(fetchWebsiteHtml(place?.website), 8000, null),
    place
      ? withTimeout(buildCompetitorRanking(input.placeId, place), 8000, null)
      : Promise.resolve(null),
    place && input.city
      ? withTimeout(
          getSearchRankings(place.name, place.website, place.primaryCategory ?? "business", input.city),
          10000,
          []
        )
      : Promise.resolve([]),
  ]);

  const ordering = detectOrderingSignals(Boolean(place?.website), html);
  const websiteAnalysis = place ? analyzeWebsite(html, place, input.city) : null;

  // Legacy 5-category scoring stays untouched — it's what drives the GHL
  // custom-field push and the grade thresholds already tuned to a live GHL
  // workflow, independent of the newer 3-section report below.
  const categories = buildCategoryScores(place, pageSpeed, ordering);
  const overallScore = computeOverallScore(categories);

  const sections = buildReportSections(place, websiteAnalysis, ordering, searchRankings);

  return {
    input,
    place,
    pageSpeed,
    ordering,
    competitorRanking,
    searchRankings,
    sections,
    categories,
    overallScore,
    grade: scoreToGrade(overallScore),
    errors,
  };
}
