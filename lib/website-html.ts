/**
 * Fetches a business's homepage HTML once so ordering-platform detection
 * and the website checklist can both work off the same snapshot instead of
 * each fetching the site separately.
 */
export async function fetchWebsiteHtml(website: string | undefined): Promise<string | null> {
  if (!website) return null;

  try {
    const res = await fetch(website, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LocalBizGrader/1.0)" },
      redirect: "follow",
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    // Site unreachable — callers treat null the same as "couldn't check".
    return null;
  }
}
