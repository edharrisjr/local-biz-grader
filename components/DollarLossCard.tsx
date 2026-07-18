import { TriangleAlert } from "lucide-react";
import type { LossEstimate } from "@/lib/scoring";

export function DollarLossCard({ estimate }: { estimate: LossEstimate }) {
  if (estimate.issueCount === 0) {
    return null;
  }

  const shownIssues = estimate.topIssues.slice(0, 5);
  const remaining = estimate.topIssues.length - shownIssues.length;

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
      <p className="text-xl font-semibold tracking-tight text-black/85 dark:text-white/85">
        You could be losing ~${estimate.monthlyLoss.toLocaleString()}/month due to{" "}
        {estimate.issueCount} problem{estimate.issueCount === 1 ? "" : "s"}
      </p>
      <p className="mb-4 mt-1 text-xs text-black/40 dark:text-white/35">
        Rough estimate based on typical impact per issue — not a measured revenue figure.
      </p>
      <ul className="space-y-1.5">
        {shownIssues.map((issue, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-black/70 dark:text-white/70">
            <TriangleAlert size={14} className="mt-0.5 shrink-0 text-red-500" />
            <span>{issue}</span>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <p className="mt-2 text-xs text-black/40 dark:text-white/35">
          +{remaining} more issue{remaining === 1 ? "" : "s"} below
        </p>
      )}
    </div>
  );
}
