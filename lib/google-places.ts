import type { PlaceDetails, PlacePrediction } from "./types";

const FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "internationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "primaryType",
  "primaryTypeDisplayName",
  "photos",
  "regularOpeningHours",
  "currentOpeningHours",
  "priceLevel",
  "reviews",
  "location",
  "editorialSummary",
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
    primaryType: data.primaryType,
    photoCount: Array.isArray(data.photos) ? data.photos.length : 0,
    photoNames: (Array.isArray(data.photos) ? data.photos : [])
      .slice(0, 6)
      .map((p: { name?: string }) => p.name)
      .filter((name: string | undefined): name is string => Boolean(name)),
    hasHours: Boolean(data.regularOpeningHours),
    openNow: data.currentOpeningHours?.openNow,
    priceLevel: data.priceLevel,
    description: data.editorialSummary?.text,
    location:
      data.location?.latitude != null && data.location?.longitude != null
        ? { lat: data.location.latitude, lng: data.location.longitude }
        : undefined,
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

interface RawNearbyPlace {
  id: string;
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  priceLevel?: string;
}

/**
 * Finds nearby businesses of the same primary type via the Places API (New)
 * Nearby Search, for the competitor-ranking section of the report.
 */
export async function findNearbyCompetitors(
  placeId: string,
  primaryType: string,
  location: { lat: number; lng: number },
  radiusMeters = 8000
): Promise<
  Array<{
    id: string;
    name: string;
    rating: number;
    userRatingCount: number;
    location: { lat: number; lng: number } | null;
    priceLevel: string | null;
  }>
> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set");
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.rating,places.userRatingCount,places.location,places.priceLevel",
    },
    body: JSON.stringify({
      includedTypes: [primaryType],
      maxResultCount: 15,
      rankPreference: "POPULARITY",
      locationRestriction: {
        circle: {
          center: { latitude: location.lat, longitude: location.lng },
          radius: radiusMeters,
        },
      },
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const places: RawNearbyPlace[] = Array.isArray(data.places) ? data.places : [];

  return places
    .filter((p) => p.id !== placeId)
    .map((p) => ({
      id: p.id,
      name: p.displayName?.text ?? "Unknown",
      rating: p.rating ?? 0,
      userRatingCount: p.userRatingCount ?? 0,
      location:
        p.location?.latitude != null && p.location?.longitude != null
          ? { lat: p.location.latitude, lng: p.location.longitude }
          : null,
      priceLevel: p.priceLevel ?? null,
    }));
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
