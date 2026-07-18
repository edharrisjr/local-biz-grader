import { NextResponse } from "next/server";
import { autocompletePlaces } from "@/lib/google-places";

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("input") ?? "";

  if (input.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const predictions = await autocompletePlaces(input);
  return NextResponse.json({ predictions });
}
