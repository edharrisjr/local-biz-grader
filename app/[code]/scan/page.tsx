import { notFound } from "next/navigation";
import { buildReport } from "@/lib/report";
import { ScoreGauge } from "@/components/ScoreGauge";
import { CategoryCard } from "@/components/CategoryCard";
import { LeadForm } from "@/components/LeadForm";

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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
          Free Online Presence Audit
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          {displayName}
          {report.input.city ? `, ${report.input.city}` : ""}
        </h1>
        <p className="mt-2 text-black/60 dark:text-white/60">
          Here&apos;s how your online presence stacks up right now.
        </p>
      </header>

      <div className="flex justify-center">
        <ScoreGauge score={report.overallScore} grade={report.grade} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {report.categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </section>

      <LeadForm report={report} />

      {report.errors.length > 0 && (
        <p className="text-center text-xs text-black/30 dark:text-white/30">
          Some data could not be loaded for this report.
        </p>
      )}
    </main>
  );
}
