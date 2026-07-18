import type { PageSpeedResult } from "./types";

/**
 * Runs a mobile PageSpeed Insights audit against a business's website.
 * Requires GOOGLE_MAPS_API_KEY (same Google Cloud key works if the
 * "PageSpeed Insights API" is enabled on the project).
 */
export async function getPageSpeed(url: string): Promise<PageSpeedResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const empty: PageSpeedResult = {
    performanceScore: null,
    mobileFriendly: null,
    fetched: false,
  };

  if (!apiKey) return empty;

  const endpoint = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
  );
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("category", "performance");

  try {
    const res = await fetch(endpoint.toString(), {
      // PageSpeed audits are slow (5-15s); give the report page a hard cap
      // via the caller's Promise.race rather than here.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return empty;

    const data = await res.json();
    const perf = data?.lighthouseResult?.categories?.performance?.score;
    const viewport =
      data?.lighthouseResult?.audits?.viewport?.score === 1;

    return {
      performanceScore: typeof perf === "number" ? Math.round(perf * 100) : null,
      mobileFriendly: viewport,
      fetched: true,
    };
  } catch {
    return empty;
  }
}
