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

/**
 * Runs a single "best {category} in {city}" search via Serper.dev and finds
 * where the target business ranks in the local map pack and organic
 * results. Real SERP data, not a simulation — but paid per call, so the
 * result is cached (24h) since buildReport() runs on every page load.
 */
export async function getSearchRanking(
  businessName: string,
  website: string | undefined,
  category: string,
  city: string
): Promise<SearchRanking | null> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey || !city) return null;

  const query = `best ${category.toLowerCase()} in ${city}`;

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
}
