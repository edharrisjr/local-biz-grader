import { NextResponse } from "next/server";
import { checkVerification, toE164 } from "@/lib/twilio";
import { pushLeadToGhl } from "@/lib/ghl";
import type { Report } from "@/lib/types";

interface CheckBody {
  phone: string;
  code: string;
  report: Report;
}

export async function POST(request: Request) {
  const body: CheckBody = await request.json();
  const e164 = toE164(body.phone ?? "");

  if (!e164 || !body.code || !body.report) {
    return NextResponse.json({ error: "phone, code, and report are required" }, { status: 400 });
  }

  let verified: boolean;
  try {
    verified = await checkVerification(e164, body.code);
  } catch (err) {
    console.error("Failed to check Twilio verification", err);
    return NextResponse.json({ error: "Verification service unavailable" }, { status: 502 });
  }

  if (!verified) {
    return NextResponse.json({ verified: false });
  }

  try {
    await pushLeadToGhl({ phone: e164 }, body.report, ["phone-verified", "unlocked-report"]);
  } catch (err) {
    // The visitor's code was still valid — don't block unlocking the
    // report just because the CRM push failed.
    console.error("Failed to push phone-verified lead to GHL", err);
  }

  return NextResponse.json({ verified: true });
}
