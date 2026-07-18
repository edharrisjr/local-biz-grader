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
 * Fetches a business's homepage HTML and looks for known ordering/booking
 * platform fingerprints. This is a heuristic, not a guarantee — sites that
 * lazy-load widgets via client-side JS may not be detected from raw HTML.
 */
export async function detectOrderingSignals(
  website: string | undefined
): Promise<OrderingSignals> {
  if (!website) {
    return {
      hasWebsite: false,
      detectedPlatforms: [],
      hasOnlineOrdering: false,
      hasReservations: false,
    };
  }

  let html = "";
  try {
    const res = await fetch(website, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LocalBizGrader/1.0)" },
      redirect: "follow",
      next: { revalidate: 86400 },
    });
    if (res.ok) html = await res.text();
  } catch {
    // Site unreachable — treat as no detectable ordering signals rather
    // than failing the whole report.
  }

  const detected = Object.entries(ORDERING_PLATFORMS)
    .filter(([, pattern]) => pattern.test(html))
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
