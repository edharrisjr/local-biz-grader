import { NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/google-places";

export async function GET(request: Request) {
  const placeId = new URL(request.url).searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  const place = await getPlaceDetails(placeId);
  return NextResponse.json({
    name: place?.name ?? null,
    website: place?.website ?? null,
    rating: place?.rating ?? null,
    userRatingCount: place?.userRatingCount ?? null,
    photoCount: place?.photoCount ?? 0,
    primaryCategory: place?.primaryCategory ?? null,
    formattedAddress: place?.formattedAddress ?? null,
    reviews: place?.reviews ?? [],
  });
}
