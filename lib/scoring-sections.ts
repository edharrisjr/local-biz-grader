import { buildGuestExperienceGroups, buildSeoContentGroups } from "./website-checklist";
import { buildLocalListingsGroups } from "./local-listings";
import type { WebsiteAnalysis } from "./website-checklist";
import type { LossEstimate } from "./scoring";
import type {
  ChecklistGroup,
  ChecklistItem,
  OrderingSignals,
  PlaceDetails,
  ReportSection,
  SearchRanking,
} from "./types";

const SEARCH_RESULTS_MAX = 40;
const GUEST_EXPERIENCE_MAX = 40;
const LOCAL_LISTINGS_MAX = 20;

function searchRankingToItem(ranking: SearchRanking): ChecklistItem {
  const rank = ranking.mapPackRank ?? ranking.organicRank;
  const where = ranking.mapPackRank != null ? "map pack" : ranking.organicRank != null ? "organic" : null;
  return {
    id: `rank:${ranking.query}`,
    label: ranking.query,
    passed: rank != null,
    detail:
      rank != null
        ? `#${rank} (${where})`
        : ranking.topMapPackResult
          ? `Unranked — #1 is ${ranking.topMapPackResult}`
          : "Unranked",
  };
}

function countItems(groups: ChecklistGroup[]): { total: number; passed: number } {
  let total = 0;
  let passed = 0;
  for (const group of groups) {
    for (const item of group.items) {
      total += 1;
      if (item.passed) passed += 1;
    }
  }
  return { total, passed };
}

function sectionScore(groups: ChecklistGroup[], maxScore: number): number {
  const { total, passed } = countItems(groups);
  if (total === 0) return 0;
  return Math.round((passed / total) * maxScore);
}

export function buildReportSections(
  place: PlaceDetails | null,
  websiteAnalysis: WebsiteAnalysis | null,
  ordering: OrderingSignals | null,
  searchRankings: SearchRanking[]
): ReportSection[] {
  const searchResultsGroups: ChecklistGroup[] = [];
  if (searchRankings.length > 0) {
    searchResultsGroups.push({
      title: "Google search results",
      items: searchRankings.map(searchRankingToItem),
    });
  }
  if (place && websiteAnalysis) {
    searchResultsGroups.push(...buildSeoContentGroups(websiteAnalysis, place));
  }

  const guestExperienceGroups: ChecklistGroup[] =
    place && websiteAnalysis ? buildGuestExperienceGroups(websiteAnalysis, place, ordering) : [];

  const localListingsGroups: ChecklistGroup[] = place
    ? buildLocalListingsGroups(place, websiteAnalysis)
    : [];

  return [
    {
      id: "searchResults",
      label: "Search Results",
      description: "Where you rank for your important keywords and neighborhoods",
      score: sectionScore(searchResultsGroups, SEARCH_RESULTS_MAX),
      maxScore: SEARCH_RESULTS_MAX,
      groups: searchResultsGroups,
    },
    {
      id: "guestExperience",
      label: "Guest Experience",
      description: "How well your website is working for your guests",
      score: sectionScore(guestExperienceGroups, GUEST_EXPERIENCE_MAX),
      maxScore: GUEST_EXPERIENCE_MAX,
      groups: guestExperienceGroups,
    },
    {
      id: "localListings",
      label: "Local Listings",
      description: "How you are presenting yourself across the web",
      score: sectionScore(localListingsGroups, LOCAL_LISTINGS_MAX),
      maxScore: LOCAL_LISTINGS_MAX,
      groups: localListingsGroups,
    },
  ];
}

/**
 * Only checks with a real, defensible link to lost customers/revenue count
 * toward the dollar-loss estimate — purely cosmetic SEO metadata (og:image,
 * a missing keyword in a title tag, etc.) is excluded so the estimate
 * doesn't balloon on nitpicks. Also deliberately excludes anything that
 * duplicates a fact the legacy 5-category system (lib/scoring.ts) already
 * counts — no website/no phone/no hours/too few reviews are gbp/reviews
 * category issues there, so counting them again here would double-charge
 * the same underlying problem. Weights are the same rough order of
 * magnitude as the legacy per-category weights.
 */
const REVENUE_IMPACT_WEIGHTS: Record<string, number> = {
  "on-site-ordering": 150,
  "direct-ordering-only": 100,
  "order-cta": 80,
  "text-content": 40,
  "phone-on-page": 60,
  favicon: 20,
  "about-section": 30,
  "customer-reviews": 40,
  "faq-section": 20,
  "direct-ordering-benefits": 30,
  "gbp-description": 30,
  "price-range": 20,
  "service-options": 20,
  "gbp-social-links": 30,
};

const RANK_ITEM_WEIGHT = 50;

const ISSUE_PHRASING: Record<string, string> = {
  "on-site-ordering": "Your ordering links send customers to an external site",
  "direct-ordering-only": "You're linking to third-party marketplaces that take a cut of your sales",
  "order-cta": "No clear call-to-action for online ordering",
  "text-content": "Not enough content on your website for Google to understand your business",
  "phone-on-page": "Your phone number isn't visible on your website",
  favicon: "Your website is missing a favicon",
  "about-section": "No compelling About Us section on your website",
  "customer-reviews": "Customer reviews aren't shown on your website",
  "faq-section": "No FAQ section on your website",
  "direct-ordering-benefits": "You're not explaining the benefits of ordering direct",
  "gbp-description": "No description on your Google Business Profile",
  "price-range": "No price range set on your Google Business Profile",
  "service-options": "No service options listed on your Google Business Profile",
  "gbp-social-links": "No social media links found for your business",
};

/**
 * Dollar-loss contribution from the new section checklists (Search
 * Results/Guest Experience/Local Listings), meant to be added to
 * lib/scoring.ts's computeLossEstimate(categories) rather than replace it —
 * the two systems check different things and both should show up here.
 */
export function computeSectionsLossEstimate(sections: ReportSection[]): LossEstimate {
  let monthlyLoss = 0;
  let issueCount = 0;
  const topIssues: string[] = [];

  for (const section of sections) {
    for (const group of section.groups) {
      for (const item of group.items) {
        if (item.passed) continue;

        if (item.id.startsWith("rank:")) {
          monthlyLoss += RANK_ITEM_WEIGHT;
          issueCount += 1;
          topIssues.push(`Not ranking on Google for "${item.label}"`);
          continue;
        }

        const weight = REVENUE_IMPACT_WEIGHTS[item.id];
        if (!weight) continue;
        monthlyLoss += weight;
        issueCount += 1;
        topIssues.push(ISSUE_PHRASING[item.id] ?? item.label);
      }
    }
  }

  return { monthlyLoss, issueCount, topIssues };
}

export interface ReviewSummary {
  reviewed: number;
  needWork: number;
}

export function summarizeSections(sections: ReportSection[]): ReviewSummary {
  let reviewed = 0;
  let needWork = 0;
  for (const section of sections) {
    for (const group of section.groups) {
      for (const item of group.items) {
        reviewed += 1;
        if (!item.passed) needWork += 1;
      }
    }
  }
  return { reviewed, needWork };
}

export function totalSectionScore(sections: ReportSection[]): number {
  return sections.reduce((sum, s) => sum + s.score, 0);
}

/** Score-to-label matching the reference sidebar's status word (distinct
 *  from the letter grade used elsewhere for GHL). */
export function scoreLabel(score: number): string {
  if (score >= 85) return "Great";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}
