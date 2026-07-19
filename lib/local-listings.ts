import type { ChecklistGroup, PlaceDetails } from "./types";
import type { WebsiteAnalysis } from "./website-checklist";

const PRICE_LEVEL_SYMBOLS: Record<string, string> = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

const MIN_QUALITY_REVIEWS = 10;

function keywordsFromCategory(category: string | undefined): string[] {
  if (!category) return [];
  return category
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && w !== "restaurant");
}

/**
 * "Local Listings" report section: how complete and consistent the Google
 * Business Profile itself is. Built entirely from Places data already
 * fetched for the report, plus the social links already found while
 * parsing the website (if any) — no extra API calls.
 */
export function buildLocalListingsGroups(
  place: PlaceDetails,
  websiteAnalysis: WebsiteAnalysis | null
): ChecklistGroup[] {
  const categoryKeywords = keywordsFromCategory(place.primaryCategory);
  const descriptionLower = place.description?.toLowerCase() ?? "";
  const socialLinks = websiteAnalysis?.socialLinks ?? [];

  return [
    {
      title: "Google Business Profile",
      items: [
        {
          id: "first-party-website",
          label: "First-party website",
          passed: Boolean(place.website),
          detail: place.website,
        },
        {
          id: "gbp-description",
          label: "Description",
          passed: Boolean(place.description),
          detail: place.description,
        },
        {
          id: "business-hours",
          label: "Business hours",
          passed: place.hasHours,
        },
        {
          id: "gbp-phone",
          label: "Phone number",
          passed: Boolean(place.phoneNumber),
          detail: place.phoneNumber,
        },
        {
          id: "price-range",
          label: "Price range",
          passed: Boolean(place.priceLevel),
          detail: place.priceLevel ? PRICE_LEVEL_SYMBOLS[place.priceLevel] : undefined,
        },
        {
          id: "service-options",
          label: "Service options",
          passed: place.serviceOptions.length > 0,
          detail: place.serviceOptions.length > 0 ? place.serviceOptions.join(", ") : undefined,
        },
        {
          id: "gbp-social-links",
          label: "Social media links",
          passed: socialLinks.length > 0,
          detail: socialLinks.length > 0 ? socialLinks.join(", ") : undefined,
        },
        {
          id: "gbp-description-keyword",
          label: "Description includes relevant keywords",
          passed: categoryKeywords.some((k) => descriptionLower.includes(k)),
        },
      ],
    },
    {
      title: "User-submitted content",
      items: [
        {
          id: "quality-reviews",
          label: "Quality reviews",
          passed: (place.userRatingCount ?? 0) >= MIN_QUALITY_REVIEWS,
          detail: `${place.userRatingCount ?? 0} reviews`,
        },
      ],
    },
  ];
}
