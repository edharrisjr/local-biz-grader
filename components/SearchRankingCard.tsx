import { Search } from "lucide-react";
import type { SearchRanking } from "@/lib/types";

function RankBadge({ rank, topResult }: { rank: number | null; topResult: string | null }) {
  if (rank != null) {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        #{rank}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/45 dark:bg-white/10 dark:text-white/40">
        Unranked
      </span>
      {topResult && (
        <span className="truncate rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-400">
          #1: {topResult}
        </span>
      )}
    </div>
  );
}

export function SearchRankingCard({ ranking }: { ranking: SearchRanking }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Search size={16} />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold">This is how you&apos;re doing online</h3>
          <p className="truncate text-sm text-black/45 dark:text-white/40">
            Real Google search for &ldquo;{ranking.query}&rdquo;
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-black/[0.02] px-3 py-2.5 dark:bg-white/[0.03]">
          <span className="text-sm text-black/65 dark:text-white/60">Map pack</span>
          <RankBadge rank={ranking.mapPackRank} topResult={ranking.topMapPackResult} />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-black/[0.02] px-3 py-2.5 dark:bg-white/[0.03]">
          <span className="text-sm text-black/65 dark:text-white/60">Organic results</span>
          <RankBadge rank={ranking.organicRank} topResult={ranking.topOrganicResult} />
        </div>
      </div>
    </div>
  );
}
