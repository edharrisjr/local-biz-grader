import type {
  CategoryScore,
  OrderingSignals,
  PageSpeedResult,
  PlaceDetails,
} from "./types";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreGbp(place: PlaceDetails | null): CategoryScore {
  const findings: string[] = [];
  if (!place) {
    return {
      id: "gbp",
      label: "Google Business Profile",
      score: 0,
      summary: "No Google Business Profile data found.",
      findings: ["Could not load a Google Business Profile for this listing."],
    };
  }

  let score = 100;

  if (!place.website) {
    score -= 25;
    findings.push("No website linked on the Google Business Profile.");
  }
  if (!place.phoneNumber) {
    score -= 15;
    findings.push("No phone number listed.");
  }
  if (!place.hasHours) {
    score -= 20;
    findings.push("Business hours are missing.");
  }
  if (place.photoCount < 5) {
    score -= 15;
    findings.push(
      `Only ${place.photoCount} photo${place.photoCount === 1 ? "" : "s"} on the listing (5+ recommended).`
    );
  }
  if (!place.primaryCategory) {
    score -= 10;
    findings.push("No primary business category set.");
  }

  if (findings.length === 0) {
    findings.push("Profile is complete: website, phone, hours, and photos are all present.");
  }

  return {
    id: "gbp",
    label: "Google Business Profile",
    score: clamp(score),
    summary: `${place.photoCount} photos, ${place.hasHours ? "hours listed" : "no hours listed"}.`,
    findings,
  };
}

function scoreReviews(place: PlaceDetails | null): CategoryScore {
  const findings: string[] = [];
  if (!place || place.rating == null || place.userRatingCount == null) {
    return {
      id: "reviews",
      label: "Reviews & Reputation",
      score: 0,
      summary: "No review data available.",
      findings: ["No reviews found on the Google Business Profile."],
    };
  }

  const ratingScore = (place.rating / 5) * 60; // up to 60 pts for star rating
  const volumeScore = Math.min(place.userRatingCount / 100, 1) * 40; // up to 40 pts for volume
  const score = ratingScore + volumeScore;

  findings.push(`${place.rating.toFixed(1)}★ average across ${place.userRatingCount} reviews.`);
  if (place.rating < 4.2) {
    findings.push("Average rating is below the 4.2+ threshold most consumers filter for.");
  }
  if (place.userRatingCount < 50) {
    findings.push("Review volume is low — fewer than 50 reviews reduces local search visibility.");
  }

  return {
    id: "reviews",
    label: "Reviews & Reputation",
    score: clamp(score),
    summary: `${place.rating.toFixed(1)}★ (${place.userRatingCount} reviews)`,
    findings,
  };
}

function scoreWebsite(
  place: PlaceDetails | null,
  pageSpeed: PageSpeedResult | null
): CategoryScore {
  const findings: string[] = [];

  if (!place?.website) {
    return {
      id: "website",
      label: "Website Performance",
      score: 0,
      summary: "No website found.",
      findings: ["This business has no website linked — losing customers to competitors who do."],
    };
  }

  if (!pageSpeed || !pageSpeed.fetched || pageSpeed.performanceScore == null) {
    return {
      id: "website",
      label: "Website Performance",
      score: 40,
      summary: "Website found, but performance could not be measured.",
      findings: ["Website exists but a PageSpeed audit could not be completed."],
    };
  }

  let score = pageSpeed.performanceScore;
  findings.push(`Mobile PageSpeed performance score: ${pageSpeed.performanceScore}/100.`);

  if (pageSpeed.mobileFriendly === false) {
    score -= 20;
    findings.push("Site is not mobile-friendly (no responsive viewport tag detected).");
  } else if (pageSpeed.mobileFriendly === true) {
    findings.push("Site has a mobile-responsive viewport configured.");
  }

  if (pageSpeed.performanceScore < 50) {
    findings.push("Load speed is in Google's “poor” range — likely hurting conversions and SEO ranking.");
  }

  return {
    id: "website",
    label: "Website Performance",
    score: clamp(score),
    summary: `Mobile performance: ${pageSpeed.performanceScore}/100`,
    findings,
  };
}

function scoreOrdering(ordering: OrderingSignals | null): CategoryScore {
  if (!ordering || !ordering.hasWebsite) {
    return {
      id: "ordering",
      label: "Online Ordering & Booking",
      score: 0,
      summary: "No website to check for ordering/booking.",
      findings: ["No online ordering or booking system detected — no website to check."],
    };
  }

  const findings: string[] = [];
  let score = 0;

  if (ordering.hasOnlineOrdering) {
    score += 60;
    findings.push(`Online ordering detected via ${ordering.detectedPlatforms.filter((p) => p !== "OpenTable" && p !== "Resy").join(", ")}.`);
  } else {
    findings.push("No online ordering system detected on the website.");
  }

  if (ordering.hasReservations) {
    score += 40;
    findings.push("Reservation/booking system detected.");
  } else {
    findings.push("No reservation or booking system detected.");
  }

  if (!ordering.hasOnlineOrdering && !ordering.hasReservations) {
    findings.push("Customers likely have to call or walk in — a major conversion gap versus competitors.");
  }

  return {
    id: "ordering",
    label: "Online Ordering & Booking",
    score: clamp(score),
    summary: ordering.detectedPlatforms.length
      ? ordering.detectedPlatforms.join(", ")
      : "None detected",
    findings,
  };
}

function scoreLocalSeo(place: PlaceDetails | null): CategoryScore {
  const findings: string[] = [];
  if (!place) {
    return {
      id: "localSeo",
      label: "Local SEO Signals",
      score: 0,
      summary: "No data available.",
      findings: ["No listing data available to evaluate local SEO."],
    };
  }

  let score = 100;
  if (!place.primaryCategory) {
    score -= 30;
    findings.push("No primary category set, which weakens relevance for local search queries.");
  }
  if (!place.formattedAddress) {
    score -= 30;
    findings.push("No verified address on file.");
  }
  if ((place.userRatingCount ?? 0) < 20) {
    score -= 20;
    findings.push("Low review count reduces ranking signals for the Local 3-Pack.");
  }
  if (!place.website) {
    score -= 20;
    findings.push("Missing website means no backlink target for local citations.");
  }

  if (findings.length === 0) {
    findings.push("Core local SEO signals (category, address, reviews, website) are all present.");
  }

  return {
    id: "localSeo",
    label: "Local SEO Signals",
    score: clamp(score),
    summary: place.primaryCategory ?? "Category not set",
    findings,
  };
}

const WEIGHTS: Record<CategoryScore["id"], number> = {
  gbp: 0.2,
  reviews: 0.25,
  website: 0.25,
  ordering: 0.2,
  localSeo: 0.1,
};

export function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function buildCategoryScores(
  place: PlaceDetails | null,
  pageSpeed: PageSpeedResult | null,
  ordering: OrderingSignals | null
): CategoryScore[] {
  return [
    scoreGbp(place),
    scoreReviews(place),
    scoreWebsite(place, pageSpeed),
    scoreOrdering(ordering),
    scoreLocalSeo(place),
  ];
}

export function computeOverallScore(categories: CategoryScore[]): number {
  const total = categories.reduce(
    (sum, c) => sum + c.score * WEIGHTS[c.id],
    0
  );
  return clamp(total);
}
