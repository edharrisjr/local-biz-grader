import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { buildReport } from "@/lib/report";
import { computeLossEstimate } from "@/lib/scoring";
import { summarizeSections } from "@/lib/scoring-sections";
import { ReportSidebar } from "@/components/ReportSidebar";
import { CompetitorWidget } from "@/components/CompetitorWidget";
import { LossWidget } from "@/components/LossWidget";
import { SearchResultsList } from "@/components/SearchResultsList";
import { ChecklistSectionCard } from "@/components/ChecklistSectionCard";
import { LeadForm } from "@/components/LeadForm";
import { ReportGate } from "@/components/ReportGateLoader";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{
    placeid?: string;
    lp?: string;
    name?: string;
    city?: string;
    grader_lp_variant?: string;
  }>;
}

export default async function ScanPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const sp = await searchParams;

  if (!sp.placeid || !sp.name) {
    notFound();
  }

  const report = await buildReport({
    code,
    placeId: sp.placeid,
    name: sp.name,
    city: sp.city,
    landingPage: sp.lp,
    variant: sp.grader_lp_variant,
  });

  const displayName = report.place?.name || report.input.name;
  const lossEstimate = computeLossEstimate(report.categories);
  const { reviewed, needWork } = summarizeSections(report.sections);
  const [searchResultsSection, guestExperienceSection, localListingsSection] = report.sections;

  // Twilio Verify isn't configured in every environment (e.g. local dev) —
  // without it the gate would have no way to ever unlock, so only render
  // it when the app can actually send/check codes.
  const otpEnabled = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
  );

  const content = (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16 sm:py-20">
      <header className="animate-fade-in-up text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-black/60 dark:bg-white/10 dark:text-white/60">
          <Sparkles size={12} />
          Free Online Presence Audit
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {displayName}
          {report.input.city ? `, ${report.input.city}` : ""}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-black/60 dark:text-white/60">
          Here&apos;s how your online presence stacks up against a typical local
          business right now.
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <ReportSidebar sections={report.sections} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <section
            className="grid animate-fade-in-up gap-4 sm:grid-cols-2"
            style={{ animationDelay: "0.15s" }}
          >
            {report.competitorRanking && <CompetitorWidget ranking={report.competitorRanking} />}
            <LossWidget estimate={lossEstimate} />
          </section>

          <p
            className="animate-fade-in-up text-sm text-black/50 dark:text-white/45"
            style={{ animationDelay: "0.2s" }}
          >
            <span className="font-semibold text-black/75 dark:text-white/70">
              {reviewed} things reviewed
            </span>
            , {needWork} need work
          </p>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            <SearchResultsList rankings={report.searchRankings} />
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <ChecklistSectionCard
              section={searchResultsSection}
              title="SEO Content"
              description="Your website needs specific content to rank higher on Google"
              skipGroupTitles={["Google search results"]}
            />
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
            <ChecklistSectionCard
              section={guestExperienceSection}
              title="Guest experience"
              description="How well your website is working for your guests"
            />
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <ChecklistSectionCard
              section={localListingsSection}
              title="Local listings"
              description="How you are presenting yourself across the web"
            />
          </div>

          <section
            className="animate-fade-in-up rounded-2xl bg-black/[0.03] p-6 dark:bg-white/[0.04]"
            style={{ animationDelay: "0.45s" }}
          >
            <h2 className="mb-2 font-semibold">Why this matters</h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              Most customers check a business online — its listing, reviews, site, and
              ability to order or book — before ever calling or walking in. Gaps in any
              one of these areas are gaps in how many of those people become
              customers. The good news: everything above is fixable, usually in
              days, not months.
            </p>
          </section>

          <LeadForm report={report} />

          {report.errors.length > 0 && (
            <p className="text-center text-xs text-black/30 dark:text-white/30">
              Some data could not be loaded for this report.
            </p>
          )}
        </div>
      </div>
    </main>
  );

  return otpEnabled ? <ReportGate report={report}>{content}</ReportGate> : content;
}
