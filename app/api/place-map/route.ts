/**
 * Proxies the Maps Static API so the API key never reaches the browser.
 * Unlike the Places Photo endpoint, Static Maps returns image bytes
 * directly rather than a redirect, so we stream the response through
 * instead of just forwarding a Location header.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = params.get("lat");
  const lng = params.get("lng");
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!lat || !lng || !apiKey) {
    return new Response(null, { status: 400 });
  }

  const mapUrl = new URL("https://maps.googleapis.com/maps/api/staticmap");
  mapUrl.searchParams.set("center", `${lat},${lng}`);
  mapUrl.searchParams.set("zoom", "16");
  mapUrl.searchParams.set("size", "500x375");
  mapUrl.searchParams.set("maptype", "roadmap");
  mapUrl.searchParams.set("markers", `color:0x123524|${lat},${lng}`);
  mapUrl.searchParams.set("key", apiKey);

  const res = await fetch(mapUrl.toString());
  if (!res.ok || !res.body) {
    return new Response(null, { status: 502 });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
