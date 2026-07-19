import { NextResponse } from "next/server";
import { findNearbyCompetitors, getPlaceDetails } from "@/lib/google-places";

export async function GET(request: Request) {
  const placeId = new URL(request.url).searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  const place = await getPlaceDetails(placeId);

  const nearby =
    place?.primaryType && place.location
      ? await findNearbyCompetitors(placeId, place.primaryType, place.location).catch(() => [])
      : [];
  const competitor = nearby.find((c) => c.location) ?? null;

  return NextResponse.json({
    name: place?.name ?? null,
    website: place?.website ?? null,
    rating: place?.rating ?? null,
    userRatingCount: place?.userRatingCount ?? null,
    photoCount: place?.photoCount ?? 0,
    primaryCategory: place?.primaryCategory ?? null,
    formattedAddress: place?.formattedAddress ?? null,
    reviews: place?.reviews ?? [],
    photoNames: place?.photoNames ?? [],
    priceLevel: place?.priceLevel ?? null,
    description: place?.description ?? null,
    location: place?.location ?? null,
    competitorName: competitor?.name ?? null,
    competitorLocation: competitor?.location ?? null,
  });
}
