import { findNearbyCompetitors } from "./google-places";
import type { Competitor, CompetitorRanking, PlaceDetails } from "./types";

const EARTH_RADIUS_MILES = 3958.8;

function distanceMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Weighted popularity score: rewards both rating and review volume together
 * so a 5.0-star listing with 2 reviews doesn't outrank a 4.5-star listing
 * with 2,000. Not a reverse-engineered match of any competitor's formula —
 * a straightforward, defensible ranking heuristic.
 */
function popularityScore(rating: number, reviewCount: number): number {
  return rating * Math.log(reviewCount + 1);
}

export async function buildCompetitorRanking(
  placeId: string,
  place: PlaceDetails
): Promise<CompetitorRanking | null> {
  if (!place.primaryType || !place.location) return null;

  const nearby = await findNearbyCompetitors(placeId, place.primaryType, place.location).catch(
    () => []
  );

  const target: Competitor = {
    name: place.name,
    rating: place.rating ?? 0,
    userRatingCount: place.userRatingCount ?? 0,
    distanceMiles: 0,
    score: popularityScore(place.rating ?? 0, place.userRatingCount ?? 0),
    isTarget: true,
  };

  const competitors: Competitor[] = nearby.map((c) => ({
    name: c.name,
    rating: c.rating,
    userRatingCount: c.userRatingCount,
    distanceMiles: c.location ? distanceMiles(place.location!, c.location) : null,
    score: popularityScore(c.rating, c.userRatingCount),
    isTarget: false,
  }));

  const all = [target, ...competitors].sort((a, b) => b.score - a.score);
  const rank = all.findIndex((c) => c.isTarget) + 1;

  return { rank, total: all.length, competitors: all };
}
