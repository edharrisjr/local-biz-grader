import type { PlaceDetails, PlacePrediction } from "./types";

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
  "reviews",
].join(",");

interface RawReview {
  rating?: number;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  authorAttribution?: { displayName?: string; photoUri?: string };
}

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
    reviews: (Array.isArray(data.reviews) ? data.reviews : [])
      .slice(0, 5)
      .map((r: RawReview) => ({
        authorName: r.authorAttribution?.displayName ?? "Anonymous",
        authorPhotoUrl: r.authorAttribution?.photoUri,
        rating: r.rating ?? 0,
        relativeTime: r.relativePublishTimeDescription ?? "",
        text: r.text?.text ?? "",
      })),
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

/**
 * Live-typing business search using the Places API (New) Autocomplete
 * endpoint. Powers the search box on the landing page.
 */
export async function autocompletePlaces(input: string): Promise<PlacePrediction[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !input.trim()) return [];

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input,
      includedPrimaryTypes: ["restaurant", "food", "store", "establishment"],
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

  return suggestions
    .map((s: { placePrediction?: Record<string, unknown> }) => s.placePrediction)
    .filter((p: unknown): p is Record<string, unknown> => Boolean(p))
    .map((p: Record<string, unknown>) => {
      const structuredFormat = p.structuredFormat as
        | { mainText?: { text?: string }; secondaryText?: { text?: string } }
        | undefined;
      const text = p.text as { text?: string } | undefined;
      return {
        placeId: p.placeId as string,
        mainText: structuredFormat?.mainText?.text ?? text?.text ?? "",
        secondaryText: structuredFormat?.secondaryText?.text ?? "",
      };
    });
}
