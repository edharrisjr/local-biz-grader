# Local Biz Grader

A cold-outreach "instant audit" tool for local businesses. Given a Google
Place ID, it scores a business's online presence (Google Business Profile,
reviews, website speed, online ordering/booking, local SEO) and renders a
personalized report page. A visitor who fills out the lead-capture form on
the report gets pushed into [GoHighLevel](https://www.gohighlevel.com/) as a
tagged/scored contact for follow-up.

## How it works

- **Report page**: `/[code]/scan?placeid=...&name=...&city=...` — `code` is
  a unique per-lead identifier (for tracking which outreach send it came
  from); the rest of the data is fetched live from Google when the page
  loads, so there's no database.
- **Scoring**: `lib/scoring.ts` combines Google Business Profile completeness,
  review rating/volume, PageSpeed Insights performance, and website scraping
  for known ordering/booking platforms (ChowNow, Toast, OpenTable, etc.) into
  five weighted category scores and an overall A–F grade.
- **Lead capture**: submitting the form on a report POSTs to `/api/lead`,
  which upserts a contact in GoHighLevel via the LeadConnector API, tagged
  with the grade and per-category scores as custom fields — wire a GHL
  workflow off the `local-biz-grader` tag to auto-send a follow-up sequence.
- **Batch link generation**: `scripts/generate-links.ts` takes a CSV of
  prospects (name/city/address, or an existing `place_id`) and outputs a CSV
  of personalized report URLs ready for a mail-merge or GHL bulk import.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `GOOGLE_MAPS_API_KEY` — a Google Maps Platform key with **Places API
     (New)** enabled.
   - `PAGESPEED_API_KEY` — a *separate* Google Cloud API key restricted to
     **PageSpeed Insights API**. This has to be a plain API key created via
     Credentials → Create Credentials → API key, not one made through the
     Maps Platform console — PageSpeed Insights isn't part of the Maps
     Platform API family, so a Maps Platform key can never be restricted to
     include it.
   - `GHL_API_KEY` / `GHL_LOCATION_ID` — a GoHighLevel Private Integration
     token (Settings → Private Integrations, `contacts.write` scope) and the
     sub-account's location ID.
   - `NEXT_PUBLIC_BASE_URL` — the deployed URL, used when generating links.
3. `npm run dev` and open `http://localhost:3000` — there's a small internal
   form there for generating a one-off test report link during QA.

## Generating cold-outreach links

```bash
cp prospects.example.csv prospects.csv   # edit with your real prospect list
npm run generate-links -- prospects.csv
```

Outputs `prospects-links.csv` with a `report_url` column per prospect.

## Deploying

Any Next.js host works (Vercel is the path of least resistance — connect the
repo and set the same env vars in the project settings).
