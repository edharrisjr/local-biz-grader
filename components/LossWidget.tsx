import { TriangleAlert } from "lucide-react";
import type { LossEstimate } from "@/lib/scoring";

export function LossWidget({ estimate }: { estimate: LossEstimate }) {
  if (estimate.issueCount === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="mb-2 flex items-center gap-2">
          <TriangleAlert size={15} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
            No major revenue risks found
          </h3>
        </div>
        <p className="text-sm text-black/55 dark:text-white/50">
          Nice work — none of your core categories show a significant gap right now.
        </p>
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
        ~${estimate.monthlyLoss.toLocaleString()}/month
      </p>
      <p className="text-sm text-black/60 dark:text-white/55">{topIssue}</p>
      {estimate.issueCount > 1 && (
        <p className="mt-2 text-xs text-black/40 dark:text-white/35">
          +{estimate.issueCount - 1} more issue{estimate.issueCount - 1 === 1 ? "" : "s"} found below
        </p>
      )}
    </div>
  );
}
