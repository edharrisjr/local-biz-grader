import { NextResponse } from "next/server";
import { pushLeadToGhl } from "@/lib/ghl";
import type { Report } from "@/lib/types";

interface LeadRequestBody {
  report: Report;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export async function POST(request: Request) {
  const body: LeadRequestBody = await request.json();

  if (!body.email || !body.report) {
    return NextResponse.json({ error: "email and report are required" }, { status: 400 });
  }

  try {
    await pushLeadToGhl(
      {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
      },
      body.report
    );
  } catch (err) {
    console.error("Failed to push lead to GHL", err);
    return NextResponse.json(
      { error: "Failed to submit lead" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
