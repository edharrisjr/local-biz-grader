import { Search } from "lucide-react";
import type { SearchRanking } from "@/lib/types";

function RankPill({ ranking }: { ranking: SearchRanking }) {
  if (ranking.mapPackRank != null) {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        #{ranking.mapPackRank} map pack
      </span>
    );
  }
  if (ranking.organicRank != null) {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        #{ranking.organicRank} organic
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/45 dark:bg-white/10 dark:text-white/40">
        Unranked map pack
      </span>
      <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/45 dark:bg-white/10 dark:text-white/40">
        Unranked organic
      </span>
    </div>
  );
}

export function SearchResultsList({ rankings }: { rankings: SearchRanking[] }) {
  if (rankings.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Search size={16} />
        </span>
        <div>
          <h3 className="font-semibold">Google search results</h3>
          <p className="text-sm text-black/45 dark:text-white/40">
            Where you rank for your important keywords and neighborhoods
          </p>
        </div>
      </div>

      <ul className="space-y-1">
        {rankings.map((ranking) => (
          <li
            key={ranking.query}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
          >
            <span className="text-black/70 dark:text-white/60">{ranking.query}</span>
            <RankPill ranking={ranking} />
          </li>
        ))}
      </ul>
    </div>
  );
}
