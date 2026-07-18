import type { OrderingSignals } from "./types";

const ORDERING_PLATFORMS: Record<string, RegExp> = {
  ChowNow: /chownow\.com/i,
  Toast: /toasttab\.com/i,
  Square: /squareup\.com\/(?:online-store|appointments)/i,
  Olo: /olo\.com|order\.online/i,
  Clover: /clover\.com\/online-ordering/i,
  "DoorDash Storefront": /order\.online|storefront\.doordash\.com/i,
  OpenTable: /opentable\.com/i,
  Resy: /resy\.com/i,
  "GoHighLevel": /msgsndr\.com|leadconnectorhq\.com/i,
};

/**
 * Looks for known ordering/booking platform fingerprints in a business's
 * already-fetched homepage HTML. This is a heuristic, not a guarantee —
 * sites that lazy-load widgets via client-side JS may not be detected from
 * raw HTML.
 */
export function detectOrderingSignals(
  hasWebsite: boolean,
  html: string | null
): OrderingSignals {
  if (!hasWebsite) {
    return {
      hasWebsite: false,
      detectedPlatforms: [],
      hasOnlineOrdering: false,
      hasReservations: false,
    };
  }

  const detected = Object.entries(ORDERING_PLATFORMS)
    .filter(([, pattern]) => pattern.test(html ?? ""))
    .map(([platform]) => platform);

  const reservationPlatforms = new Set(["OpenTable", "Resy"]);
  const hasReservations = detected.some((p) => reservationPlatforms.has(p));
  const hasOnlineOrdering = detected.some((p) => !reservationPlatforms.has(p));

  return {
    hasWebsite: true,
    detectedPlatforms: detected,
    hasOnlineOrdering,
    hasReservations,
  };
}
