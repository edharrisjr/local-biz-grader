import { buildGuestExperienceGroups, buildSeoContentGroups } from "./website-checklist";
import { buildLocalListingsGroups } from "./local-listings";
import type { WebsiteAnalysis } from "./website-checklist";
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
