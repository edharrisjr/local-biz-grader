import type { PlaceDetails } from "./types";

const FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "internationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "primaryTypeDisplayName",
  "photos",
  "regularOpeningHours",
  "currentOpeningHours",
  "priceLevel",
].join(",");

/**
 * Fetches business details from the Places API (New) using a place_id.
 * Requires GOOGLE_MAPS_API_KEY with the "Places API (New)" enabled.
 */
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set");
  }

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      // Place details rarely change within a cold-outreach send window.
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = await res.json();

  return {
    name: data.displayName?.text ?? "",
    formattedAddress: data.formattedAddress,
    phoneNumber: data.internationalPhoneNumber,
    website: data.websiteUri,
    rating: data.rating,
    userRatingCount: data.userRatingCount,
    primaryCategory: data.primaryTypeDisplayName?.text,
    photoCount: Array.isArray(data.photos) ? data.photos.length : 0,
    hasHours: Boolean(data.regularOpeningHours),
    openNow: data.currentOpeningHours?.openNow,
    priceLevel: data.priceLevel,
  };
}

/**
 * Resolves a place_id from a free-text business name + address/city using
 * the Places API (New) Text Search. Used by the batch link generator when a
 * prospect list only has a name/address, not an existing place_id.
 */
export async function findPlaceId(query: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set");
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({ textQuery: query, pageSize: 1 }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.places?.[0]?.id ?? null;
}
