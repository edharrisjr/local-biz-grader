import type { SearchRanking } from "./types";

interface SerperPlace {
  title?: string;
  position?: number;
}

interface SerperOrganicResult {
  title?: string;
  link?: string;
  position?: number;
}

interface SerperResponse {
  places?: SerperPlace[];
  organic?: SerperOrganicResult[];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function runSerperQuery(
  query: string,
  businessName: string,
  website: string | undefined,
  apiKey: string
): Promise<SearchRanking | null> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, gl: "us" }),
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data: SerperResponse = await res.json();
    const targetName = normalize(businessName);
    const targetHost = website ? hostnameOf(website) : "";

    const places = data.places ?? [];
    const mapPackMatch = places.find((p) => p.title && normalize(p.title) === targetName);

    const organic = data.organic ?? [];
    const organicMatch = organic.find(
      (r) => targetHost && r.link && hostnameOf(r.link) === targetHost
    );

    return {
      query,
      mapPackRank: mapPackMatch?.position ?? null,
      organicRank: organicMatch?.position ?? null,
      topMapPackResult: places[0]?.title ?? null,
      topOrganicResult: organic[0]?.title ?? null,
    };
  } catch {
    // Network failure (e.g. Serper unreachable) — degrade to no ranking
    // data for this query rather than crashing the whole report page.
    return null;
  }
}

/**
 * Runs a small set of real Google searches via Serper.dev (three query
 * variants on the same category + city) and finds where the target
 * business ranks in the local map pack and organic results for each. Real
 * SERP data, not a simulation — but paid per call, so each result is
 * cached (24h) since buildReport() runs on every page load.
 */
export async function getSearchRankings(
  businessName: string,
  website: string | undefined,
  category: string,
  city: string
): Promise<SearchRanking[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey || !city) return [];

  const categoryLower = category.toLowerCase();
  const queries = [
    `best ${categoryLower} in ${city}`,
    `top ${categoryLower} in ${city}`,
    `${categoryLower} near ${city}`,
  ];

  const results = await Promise.all(
    queries.map((query) => runSerperQuery(query, businessName, website, apiKey))
  );

  return results.filter((r): r is SearchRanking => r !== null);
}
