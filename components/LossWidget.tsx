import { PhoneMissed, TriangleAlert, UserX } from "lucide-react";
import type { LossEstimate } from "@/lib/scoring";
import type { OpportunityCost } from "@/lib/opportunity-cost";

const OPPORTUNITY_ICONS: Record<string, typeof PhoneMissed> = {
  "missed-call-textback": PhoneMissed,
  "followup-retention": UserX,
};

function OpportunityList({
  opportunities,
  personalized,
}: {
  opportunities: OpportunityCost[];
  personalized: boolean;
}) {
  return (
    <div className="mt-3 space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
      <p className="text-xs font-medium text-black/40 dark:text-white/35">
        {personalized
          ? "Based on your answers:"
          : "Also typically costing local businesses (industry estimate, not specific to your listing):"}
      </p>
      <ul className="space-y-1.5">
        {opportunities.map((o) => {
          const Icon = OPPORTUNITY_ICONS[o.id] ?? TriangleAlert;
          return (
            <li key={o.id} className="flex items-start gap-2 text-sm">
              <Icon size={14} className="mt-0.5 shrink-0 text-black/35 dark:text-white/30" />
              <span className="text-black/60 dark:text-white/55">
                {o.label}
                <span className="text-black/40 dark:text-white/35">
                  {" "}
                  — ~${o.monthlyAmount.toLocaleString()}/mo
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LossWidget({
  estimate,
  opportunities,
  personalized = false,
}: {
  estimate: LossEstimate;
  opportunities: OpportunityCost[];
  personalized?: boolean;
}) {
  const opportunityTotal = opportunities.reduce((sum, o) => sum + o.monthlyAmount, 0);
  const totalLoss = estimate.monthlyLoss + opportunityTotal;

  if (estimate.issueCount === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <div className="mb-2 flex items-center gap-2">
          <TriangleAlert size={15} className="text-amber-600" />
          <h3 className="text-sm font-semibold text-black/85 dark:text-white/85">
            No major issues found — but you may still be leaving money on the table
          </h3>
        </div>
        <p className="mb-1 text-lg font-bold tracking-tight text-black/85 dark:text-white/85">
          ~${totalLoss.toLocaleString()}/month
        </p>
        <p className="text-sm text-black/55 dark:text-white/50">
          None of your core categories show a significant gap right now.
        </p>
        <OpportunityList opportunities={opportunities} personalized={personalized} />
      </div>
    );
  }

  const topIssue = estimate.topIssues[0];

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
      <div className="mb-2 flex items-center gap-2">
        <TriangleAlert size={15} className="text-red-500" />
        <h3 className="text-sm font-semibold text-black/85 dark:text-white/85">
          You&apos;re losing sales until you fix this
        </h3>
      </div>
      <p className="mb-1 text-lg font-bold tracking-tight text-black/85 dark:text-white/85">
        ~${totalLoss.toLocaleString()}/month
      </p>
      <p className="text-sm text-black/60 dark:text-white/55">{topIssue}</p>
      {estimate.issueCount > 1 && (
        <p className="mt-2 text-xs text-black/40 dark:text-white/35">
          +{estimate.issueCount - 1} more issue{estimate.issueCount - 1 === 1 ? "" : "s"} found below
        </p>
      )}
      <OpportunityList opportunities={opportunities} personalized={personalized} />
    </div>
  );
}
