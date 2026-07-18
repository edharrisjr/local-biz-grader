import { NextResponse } from "next/server";
import { startVerification, toE164 } from "@/lib/twilio";

export async function POST(request: Request) {
  const body = await request.json();
  const phone = typeof body.phone === "string" ? body.phone : "";
  const e164 = toE164(phone);

  if (!e164) {
    return NextResponse.json({ error: "Enter a valid US phone number" }, { status: 400 });
  }

  try {
    const ok = await startVerification(e164);
    if (!ok) {
      return NextResponse.json({ error: "Could not send verification code" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to start Twilio verification", err);
    return NextResponse.json({ error: "Verification service unavailable" }, { status: 502 });
  }
}
