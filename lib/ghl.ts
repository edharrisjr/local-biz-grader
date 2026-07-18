import type { CategoryId, Report } from "./types";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

interface LeadFormInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/**
 * GHL custom field IDs (Settings -> Custom Fields in the sub-account).
 * The "social" field is a display-name mismatch, not a real category —
 * it's where the localSeo score is written; rename the field label in GHL
 * rather than the key here.
 */
const CATEGORY_FIELD_IDS: Record<CategoryId, string> = {
  gbp: "08DUCpmKUrgXWhYNjKoa", // grader_google_score
  website: "f2fFrrEGIiaIxXnoM1bb", // grader_website_score
  reviews: "9NGlsG8BzLtWsZQI5csx", // grader_reviews_score
  ordering: "zTBfI7WZEFmLS6DX2V56", // grader_ordering_score
  localSeo: "fEx0p2nJZzb8TX4t8WO8", // grader_social_score (renamed in GHL)
};

const FIELD_IDS = {
  reportUrl: "PonUDXiz1JTXkH2GzVJw", // grader_report_url
  businessName: "AS9QrGfomQJ4FrqLSTAZ", // grader_business_name
  overallGrade: "RqHMeAOT43RVDynN4vtU", // grader_overall_grade
  overallScore: "JYkuhl9Lh9T31zqTozML", // grader_overall_score
};

function buildReportUrl(report: Report): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const params = new URLSearchParams({
    placeid: report.input.placeId,
    name: report.input.name,
    lp: report.input.landingPage ?? "homepage",
    grader_lp_variant: report.input.variant ?? "champion",
  });
  if (report.input.city) params.set("city", report.input.city);
  return `${baseUrl}/${report.input.code}/scan?${params.toString()}`;
}

/**
 * Upserts a contact in GoHighLevel and tags/annotates it with the report's
 * score data so it can trigger a workflow (e.g. "send audit + book a call").
 *
 * Requires a GHL Private Integration token (GHL_API_KEY) with the
 * contacts.write scope, and the sub-account's GHL_LOCATION_ID.
 * https://highlevel.stoplight.io/docs/integrations/
 */
export async function pushLeadToGhl(
  lead: LeadFormInput,
  report: Report,
  extraTags: string[] = []
) {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    throw new Error("GHL_API_KEY / GHL_LOCATION_ID are not configured");
  }

  const tags = [
    "local-biz-grader",
    `grade-${report.grade.toLowerCase()}`,
    `lp-${report.input.landingPage ?? "unknown"}`,
    ...extraTags,
  ];

  const customFields = [
    { id: FIELD_IDS.reportUrl, field_value: buildReportUrl(report) },
    { id: FIELD_IDS.businessName, field_value: report.input.name },
    { id: FIELD_IDS.overallGrade, field_value: report.grade },
    { id: FIELD_IDS.overallScore, field_value: String(report.overallScore) },
    ...report.categories.map((c) => ({
      id: CATEGORY_FIELD_IDS[c.id],
      field_value: String(c.score),
    })),
  ];

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
