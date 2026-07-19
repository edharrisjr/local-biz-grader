export type CategoryId =
  | "gbp"
  | "reviews"
  | "website"
  | "ordering"
  | "localSeo";

export interface CategoryScore {
  id: CategoryId;
  label: string;
  score: number; // 0-100
  summary: string;
  findings: string[];
  /** Curated subset of findings that represent real problems, used for the
   *  dollar-loss estimate — findings includes positive/neutral statements
   *  too, this doesn't. */
  issues: string[];
}

/** Answers to the 4 pre-report qualification questions, used to compute a
 *  personalized (rather than flat industry-benchmark) revenue-loss
 *  estimate, and carried through to the GHL push once a lead identity
 *  exists. */
export interface RevenueQualification {
  monthlySales: number;
  avgOrderValue: number;
  missedCallsPerMonth: number;
  hasFollowUpSystem: boolean;
}

export interface ReportInput {
  code: string;
  placeId: string;
  name: string;
  city?: string;
  landingPage?: string;
  variant?: string;
  qualification?: RevenueQualification;
}

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceReview {
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  relativeTime: string;
  text: string;
}

export interface PlaceDetails {
  name: string;
  formattedAddress?: string;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  userRatingCount?: number;
  primaryCategory?: string;
  primaryType?: string;
  photoCount: number;
  photoNames: string[];
  hasHours: boolean;
  openNow?: boolean;
  priceLevel?: string;
  description?: string;
  location?: { lat: number; lng: number };
  reviews: PlaceReview[];
  /** Human-readable labels for the boolean service attributes Places
   *  actually returned as true (e.g. "Outdoor seating", "Delivery") —
   *  omits anything Google didn't report, never inferred. */
  serviceOptions: string[];
}

export interface PageSpeedResult {
  performanceScore: number | null; // 0-100
  mobileFriendly: boolean | null;
  fetched: boolean;
}

export interface OrderingSignals {
  hasWebsite: boolean;
  detectedPlatforms: string[];
  hasOnlineOrdering: boolean;
  hasReservations: boolean;
}

export interface Competitor {
  name: string;
  rating: number;
  userRatingCount: number;
  distanceMiles: number | null;
  score: number;
  isTarget: boolean;
}

export interface CompetitorRanking {
  rank: number;
  total: number;
  competitors: Competitor[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface ChecklistGroup {
  title: string;
  items: ChecklistItem[];
}

export interface SearchRanking {
  query: string;
  mapPackRank: number | null;
  organicRank: number | null;
  topMapPackResult: string | null;
  topOrganicResult: string | null;
}

export type ReportSectionId = "searchResults" | "guestExperience" | "localListings";

export interface ReportSection {
  id: ReportSectionId;
  label: string;
  description: string;
  score: number;
  maxScore: number;
  groups: ChecklistGroup[];
}

export interface Report {
  input: ReportInput;
  place: PlaceDetails | null;
  pageSpeed: PageSpeedResult | null;
  ordering: OrderingSignals | null;
  competitorRanking: CompetitorRanking | null;
  searchRankings: SearchRanking[];
  /** New 3-section report structure (Search Results / Guest Experience /
   *  Local Listings), matching the reference grader UI. Computed
   *  separately from `categories`/`overallScore`/`grade` below, which are
   *  left untouched on purpose — those still drive the GHL custom-field
   *  push and the grade thresholds already tuned to a live GHL workflow. */
  sections: ReportSection[];
  categories: CategoryScore[];
  overallScore: number;
  grade: string;
  errors: string[];
}
