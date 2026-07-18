import type { Report } from "./types";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

interface LeadFormInput {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
}

/**
 * Upserts a contact in GoHighLevel and tags/annotates it with the report's
 * score data so it can trigger a workflow (e.g. "send audit + book a call").
 *
 * Requires a GHL Private Integration token (GHL_API_KEY) with the
 * contacts.write scope, and the sub-account's GHL_LOCATION_ID.
 * https://highlevel.stoplight.io/docs/integrations/
 */
export async function pushLeadToGhl(lead: LeadFormInput, report: Report) {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    throw new Error("GHL_API_KEY / GHL_LOCATION_ID are not configured");
  }

  const tags = [
    "local-biz-grader",
    `grade-${report.grade.toLowerCase()}`,
    `lp-${report.input.landingPage ?? "unknown"}`,
  ];

  const customFields = report.categories.map((c) => ({
    key: `grader_${c.id}_score`,
    field_value: String(c.score),
  }));

  const res = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Version: GHL_API_VERSION,
    },
    body: JSON.stringify({
      locationId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      companyName: report.input.name,
      tags,
      customFields,
      source: `local-biz-grader:${report.input.code}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GHL upsert failed (${res.status}): ${body}`);
  }

  return res.json();
}
