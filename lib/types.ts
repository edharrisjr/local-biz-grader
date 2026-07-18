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

export interface PlaceDetails {
  name: string;
  formattedAddress?: string;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  userRatingCount?: number;
  primaryCategory?: string;
  photoCount: number;
  hasHours: boolean;
  openNow?: boolean;
  priceLevel?: string;
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

export interface Report {
  input: ReportInput;
  place: PlaceDetails | null;
  pageSpeed: PageSpeedResult | null;
  ordering: OrderingSignals | null;
  categories: CategoryScore[];
  overallScore: number;
  grade: string;
  errors: string[];
}
