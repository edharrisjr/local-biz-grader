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

export interface ReportInput {
  code: string;
  placeId: string;
  name: string;
  city?: string;
  landingPage?: string;
  variant?: string;
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

export interface SearchRanking {
  query: string;
  mapPackRank: number | null;
  organicRank: number | null;
  topMapPackResult: string | null;
  topOrganicResult: string | null;
}

export interface Report {
  input: ReportInput;
  place: PlaceDetails | null;
  pageSpeed: PageSpeedResult | null;
  ordering: OrderingSignals | null;
  competitorRanking: CompetitorRanking | null;
  searchRanking: SearchRanking | null;
  categories: CategoryScore[];
  overallScore: number;
  grade: string;
  errors: string[];
}
