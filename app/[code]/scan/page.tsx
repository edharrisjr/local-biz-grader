import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { buildReport } from "@/lib/report";
import { CATEGORY_BENCHMARKS, OVERALL_BENCHMARK, computeLossEstimate } from "@/lib/scoring";
import { ScoreGauge } from "@/components/ScoreGauge";
import { CategoryCard } from "@/components/CategoryCard";
import { CompetitorTable } from "@/components/CompetitorTable";
import { SearchRankingCard } from "@/components/SearchRankingCard";
import { WebsiteChecklistCard } from "@/components/WebsiteChecklistCard";
import { DollarLossCard } from "@/components/DollarLossCard";
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

  // Twilio Verify isn't configured in every environment (e.g. local dev) —
  // without it the gate would have no way to ever unlock, so only render
  // it when the app can actually send/check codes.
  const otpEnabled = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
  );

  const content = (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-14 px-6 py-16 sm:py-20">
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

      <div
        className="flex animate-fade-in-up justify-center"
        style={{ animationDelay: "0.1s" }}
      >
        <ScoreGauge score={report.overallScore} grade={report.grade} benchmark={OVERALL_BENCHMARK} />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <DollarLossCard estimate={lossEstimate} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {report.categories.map((category, i) => (
          <div
            key={category.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${0.2 + i * 0.06}s` }}
          >
            <CategoryCard category={category} benchmark={CATEGORY_BENCHMARKS[category.id]} />
          </div>
        ))}
      </section>

      {report.searchRanking && (
        <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <SearchRankingCard ranking={report.searchRanking} />
        </div>
      )}

      {report.competitorRanking && (
        <div className="animate-fade-in-up" style={{ animationDelay: "0.44s" }}>
          <CompetitorTable ranking={report.competitorRanking} />
        </div>
      )}

      {report.websiteChecklist && (
        <div className="animate-fade-in-up" style={{ animationDelay: "0.48s" }}>
          <WebsiteChecklistCard groups={report.websiteChecklist} />
        </div>
      )}

      <section
        className="animate-fade-in-up rounded-2xl bg-black/[0.03] p-6 dark:bg-white/[0.04]"
        style={{ animationDelay: "0.5s" }}
      >
        <h2 className="mb-2 font-semibold">Why this matters</h2>
        <p className="text-sm text-black/60 dark:text-white/60">
          Most customers check a business online — its listing, reviews, site, and
          ability to order or book — before ever calling or walking in. Gaps in any
          one of these categories are gaps in how many of those people become
          customers. The good news: every category above is fixable, usually in
          days, not months.
        </p>
      </section>

      <LeadForm report={report} />

      {report.errors.length > 0 && (
        <p className="text-center text-xs text-black/30 dark:text-white/30">
          Some data could not be loaded for this report.
        </p>
      )}
    </main>
  );

  return otpEnabled ? <ReportGate report={report}>{content}</ReportGate> : content;
}
