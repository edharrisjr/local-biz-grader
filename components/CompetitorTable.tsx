import { Trophy } from "lucide-react";
import type { CompetitorRanking } from "@/lib/types";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function CompetitorTable({ ranking }: { ranking: CompetitorRanking }) {
  const { rank, total, competitors } = ranking;
  const isTop = rank === 1;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            isTop
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          <Trophy size={16} />
        </span>
        <div>
          <h3 className="font-semibold">
            {isTop
              ? `You're ranked #1 of ${total} nearby`
              : `You're ranking ${ordinal(rank)} of ${total} nearby`}
          </h3>
          <p className="text-sm text-black/45 dark:text-white/40">
            Ranked by rating and review volume among similar nearby businesses
          </p>
        </div>
      </div>

      <ol className="space-y-1">
        {competitors.map((c, i) => (
          <li
            key={`${c.name}-${i}`}
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
              c.isTarget ? "bg-amber-500/10 font-medium" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-6 shrink-0 text-black/40 dark:text-white/35">{i + 1}</span>
              <span className="truncate">{c.name}</span>
              {c.isTarget && (
                <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                  You
                </span>
              )}
            </div>
            <span className="shrink-0 text-black/50 dark:text-white/40">
              {c.rating.toFixed(1)}★ ({c.userRatingCount})
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
