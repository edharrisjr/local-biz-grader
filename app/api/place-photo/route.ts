import { NextResponse } from "next/server";

/**
 * Proxies a Places API (New) photo resource name to the actual image.
 * The Photos endpoint 302s to a googleusercontent.com URL when called with
 * a key; we follow that redirect server-side (keeping the key out of the
 * browser) and hand the browser the final image URL to fetch directly.
 */
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name");
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!name || !apiKey) {
    return new NextResponse(null, { status: 400 });
  }

  const res = await fetch(
    `https://places.googleapis.com/v1/${name}/media?maxWidthPx=500&key=${apiKey}`,
    { redirect: "manual" }
  );

  const location = res.headers.get("location");
  if (!location) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.redirect(location);
}
