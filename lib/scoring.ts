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
  const issues: string[] = [];
  if (!place) {
    return {
      id: "gbp",
      label: "Google Business Profile",
      score: 0,
      summary: "No Google Business Profile data found.",
      findings: ["Could not load a Google Business Profile for this listing."],
      issues: ["No Google Business Profile found"],
    };
  }

  let score = 100;

  if (!place.website) {
    score -= 25;
    findings.push("No website linked on the Google Business Profile.");
    issues.push("No website linked on your Google Business Profile");
  }
  if (!place.phoneNumber) {
    score -= 15;
    findings.push("No phone number listed.");
    issues.push("No phone number listed on your Google listing");
  }
  if (!place.hasHours) {
    score -= 20;
    findings.push("Business hours are missing.");
    issues.push("Business hours are missing from your Google listing");
  }
  if (place.photoCount < 5) {
    score -= 15;
    findings.push(
      `Only ${place.photoCount} photo${place.photoCount === 1 ? "" : "s"} on the listing (5+ recommended).`
    );
    issues.push("Too few photos on your Google Business Profile");
  }
  if (!place.primaryCategory) {
    score -= 10;
    findings.push("No primary business category set.");
    issues.push("No primary category set on your Google listing");
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
    issues,
  };
}

function scoreReviews(place: PlaceDetails | null): CategoryScore {
  const findings: string[] = [];
  const issues: string[] = [];
  if (!place || place.rating == null || place.userRatingCount == null) {
    return {
      id: "reviews",
      label: "Reviews & Reputation",
      score: 0,
      summary: "No review data available.",
      findings: ["No reviews found on the Google Business Profile."],
      issues: ["No review data found"],
    };
  }

  const ratingScore = (place.rating / 5) * 60; // up to 60 pts for star rating
  const volumeScore = Math.min(place.userRatingCount / 100, 1) * 40; // up to 40 pts for volume
  const score = ratingScore + volumeScore;

  findings.push(`${place.rating.toFixed(1)}★ average across ${place.userRatingCount} reviews.`);
  if (place.rating < 4.2) {
    findings.push("Average rating is below the 4.2+ threshold most consumers filter for.");
    issues.push("Average rating is below what most customers filter for");
  }
  if (place.userRatingCount < 50) {
    findings.push("Review volume is low — fewer than 50 reviews reduces local search visibility.");
    issues.push("Too few reviews to build trust with new customers");
  }

  return {
    id: "reviews",
    label: "Reviews & Reputation",
    score: clamp(score),
    summary: `${place.rating.toFixed(1)}★ (${place.userRatingCount} reviews)`,
    findings,
    issues,
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
      issues: ["No website linked — losing customers to competitors who do"],
    };
  }

  if (!pageSpeed || !pageSpeed.fetched || pageSpeed.performanceScore == null) {
    return {
      id: "website",
      label: "Website Performance",
      score: 40,
      summary: "Website found, but performance could not be measured.",
      findings: ["Website exists but a PageSpeed audit could not be completed."],
      issues: [],
    };
  }

  const issues: string[] = [];
  let score = pageSpeed.performanceScore;
  findings.push(`Mobile PageSpeed performance score: ${pageSpeed.performanceScore}/100.`);

  if (pageSpeed.mobileFriendly === false) {
    score -= 20;
    findings.push("Site is not mobile-friendly (no responsive viewport tag detected).");
    issues.push("Your website is not mobile-friendly");
  } else if (pageSpeed.mobileFriendly === true) {
    findings.push("Site has a mobile-responsive viewport configured.");
  }

  if (pageSpeed.performanceScore < 50) {
    findings.push("Load speed is in Google's “poor” range — likely hurting conversions and SEO ranking.");
    issues.push("Your website is slow");
  }

  return {
    id: "website",
    label: "Website Performance",
    score: clamp(score),
    summary: `Mobile performance: ${pageSpeed.performanceScore}/100`,
    findings,
    issues,
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
      issues: [],
    };
  }

  const findings: string[] = [];
  const issues: string[] = [];
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
    issues.push("No online ordering or booking system on your website");
  } else if (!ordering.hasOnlineOrdering) {
    issues.push("No online ordering system on your website");
  }

  return {
    id: "ordering",
    label: "Online Ordering & Booking",
    score: clamp(score),
    summary: ordering.detectedPlatforms.length
      ? ordering.detectedPlatforms.join(", ")
      : "None detected",
    findings,
    issues,
  };
}

function scoreLocalSeo(place: PlaceDetails | null): CategoryScore {
  const findings: string[] = [];
  const issues: string[] = [];
  if (!place) {
    return {
      id: "localSeo",
      label: "Local SEO Signals",
      score: 0,
      summary: "No data available.",
      findings: ["No listing data available to evaluate local SEO."],
      issues: ["No listing data available to evaluate local SEO"],
    };
  }

  let score = 100;
  if (!place.primaryCategory) {
    score -= 30;
    findings.push("No primary category set, which weakens relevance for local search queries.");
    issues.push("No primary category set, weakening local search relevance");
  }
  if (!place.formattedAddress) {
    score -= 30;
    findings.push("No verified address on file.");
    issues.push("No verified address on file");
  }
  if ((place.userRatingCount ?? 0) < 20) {
    score -= 20;
    findings.push("Low review count reduces ranking signals for the Local 3-Pack.");
    issues.push("Low review count is hurting your local search ranking");
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
    issues,
  };
}

/** Rough "typical local business" reference points for the comparison bars. */
export const CATEGORY_BENCHMARKS: Record<CategoryScore["id"], number> = {
  gbp: 72,
  reviews: 68,
  website: 58,
  ordering: 45,
  localSeo: 65,
};

const WEIGHTS: Record<CategoryScore["id"], number> = {
  gbp: 0.2,
  reviews: 0.25,
  website: 0.25,
  ordering: 0.2,
  localSeo: 0.1,
};

export function scoreToGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
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

export const OVERALL_BENCHMARK = clamp(
  Object.entries(CATEGORY_BENCHMARKS).reduce(
    (sum, [id, value]) => sum + value * WEIGHTS[id as CategoryScore["id"]],
    0
  )
);

/**
 * Illustrative $/month impact per flagged issue, weighted toward categories
 * with more direct revenue impact (ordering, website) vs. profile hygiene
 * (gbp). This is a marketing estimate, not a measured revenue figure —
 * labeled as such wherever it's shown.
 */
const MONTHLY_IMPACT_PER_ISSUE: Record<CategoryScore["id"], number> = {
  gbp: 40,
  reviews: 60,
  website: 120,
  ordering: 180,
  localSeo: 50,
};

export interface LossEstimate {
  monthlyLoss: number;
  issueCount: number;
  topIssues: string[];
}

export function computeLossEstimate(categories: CategoryScore[]): LossEstimate {
  let monthlyLoss = 0;
  let issueCount = 0;
  const topIssues: string[] = [];

  for (const category of categories) {
    for (const issue of category.issues) {
      monthlyLoss += MONTHLY_IMPACT_PER_ISSUE[category.id];
      issueCount += 1;
      topIssues.push(issue);
    }
  }

  return { monthlyLoss, issueCount, topIssues };
}
