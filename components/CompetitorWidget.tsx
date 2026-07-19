import { Trophy } from "lucide-react";
import type { CompetitorRanking } from "@/lib/types";

export function CompetitorWidget({ ranking }: { ranking: CompetitorRanking }) {
  const beatingYou = ranking.competitors.filter((c) => !c.isTarget).slice(0, 5);

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-center gap-2">
        <Trophy size={15} className="text-amber-500" />
        <h3 className="text-sm font-semibold">Who&apos;s beating you on Google</h3>
      </div>
      {beatingYou.length === 0 ? (
        <p className="text-sm text-black/45 dark:text-white/40">
          You&apos;re outranking the nearby competitors we found.
        </p>
      ) : (
        <ul className="space-y-2">
          {beatingYou.map((c, i) => (
            <li key={`${c.name}-${i}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-black/70 dark:text-white/65">{c.name}</span>
              <span className="shrink-0 rounded-full bg-black/[0.04] px-2 py-0.5 text-xs tabular-nums text-black/50 dark:bg-white/[0.06] dark:text-white/45">
                {c.rating.toFixed(1)}★ ({c.userRatingCount})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
