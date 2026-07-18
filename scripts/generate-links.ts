/**
 * Batch-generates personalized report links for cold outreach.
 *
 * Input CSV columns: name, city, place_id (optional), address (optional)
 *   - If place_id is present, it's used directly.
 *   - Otherwise `name` + `address` (or `city`) is resolved to a place_id
 *     via the Places API Text Search.
 *
 * Output: CSV with the original columns plus `place_id` and `report_url`,
 * ready for a mail-merge / GHL bulk contact import.
 *
 * Usage:
 *   npm run generate-links -- prospects.csv > report-links.csv
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { nanoid } from "nanoid";
import { findPlaceId } from "../lib/google-places";

interface ProspectRow {
  name: string;
  city?: string;
  address?: string;
  place_id?: string;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: npm run generate-links -- <prospects.csv> [output.csv]");
    process.exit(1);
  }
  const outputPath = process.argv[3] ?? inputPath.replace(/\.csv$/, "") + "-links.csv";

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("Set NEXT_PUBLIC_BASE_URL in .env (e.g. https://audit.yourdomain.com)");
    process.exit(1);
  }

  const raw = readFileSync(inputPath, "utf-8");
  const rows: ProspectRow[] = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  const results: Array<ProspectRow & { report_url: string }> = [];

  for (const row of rows) {
    let placeId = row.place_id;

    if (!placeId) {
      const query = [row.name, row.address ?? row.city].filter(Boolean).join(", ");
      try {
        placeId = (await findPlaceId(query)) ?? undefined;
      } catch (err) {
        console.error(`Failed to resolve place_id for "${row.name}":`, err);
      }
    }

    if (!placeId) {
      console.warn(`Skipping "${row.name}" — no place_id found.`);
      continue;
    }

    const code = nanoid(10);
    const params = new URLSearchParams({
      placeid: placeId,
      name: row.name,
      lp: "homepage",
      grader_lp_variant: "champion",
    });
    if (row.city) params.set("city", row.city);

    const report_url = `${baseUrl}/${code}/scan?${params.toString()}`;
    results.push({ ...row, place_id: placeId, report_url });
  }

  const header = "name,city,place_id,report_url";
  const lines = results.map(
    (r) => `"${r.name}","${r.city ?? ""}","${r.place_id}","${r.report_url}"`
  );
  writeFileSync(outputPath, [header, ...lines].join("\n") + "\n");

  console.log(`Wrote ${results.length} report links to ${outputPath}`);
}

main();
