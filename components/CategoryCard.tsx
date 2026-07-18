import { Gauge, MapPin, Search, ShoppingCart, Star, type LucideIcon } from "lucide-react";
import type { CategoryId, CategoryScore } from "@/lib/types";

const ICONS: Record<CategoryId, LucideIcon> = {
  gbp: MapPin,
  reviews: Star,
  website: Gauge,
  ordering: ShoppingCart,
  localSeo: Search,
};

function severity(score: number): "good" | "warn" | "bad" {
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "bad";
}

const SEVERITY_STYLES = {
  good: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/15",
  },
  warn: {
    bar: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/15",
  },
  bad: {
    bar: "bg-red-500",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
    ring: "ring-red-500/15",
  },
} as const;

export function CategoryCard({
  category,
  benchmark,
}: {
  category: CategoryScore;
  benchmark?: number;
}) {
  const Icon = ICONS[category.id];
  const level = severity(category.score);
  const styles = SEVERITY_STYLES[level];

  return (
    <div
      className={`rounded-2xl border border-black/10 bg-black/[0.015] p-5 ring-1 ring-transparent transition-shadow hover:ring-1 dark:border-white/10 dark:bg-white/[0.02] ${styles.ring}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.badge}`}>
            <Icon size={16} strokeWidth={2.25} />
          </span>
          <h3 className="font-semibold">{category.label}</h3>
        </div>
        <span className="text-sm font-semibold tabular-nums text-black/70 dark:text-white/70">
          {category.score}
          <span className="text-black/35 dark:text-white/35">/100</span>
        </span>
      </div>

      <div className="relative mb-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${category.score}%` }} />
        {benchmark != null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-black/40 dark:bg-white/50"
            style={{ left: `${benchmark}%` }}
            title={`Typical local business: ${benchmark}/100`}
          />
        )}
      </div>

      <p className="mb-2 text-sm text-black/55 dark:text-white/55">{category.summary}</p>
      <ul className="space-y-1.5 text-sm">
        {category.findings.map((f, i) => (
          <li key={i} className="flex gap-2 text-black/70 dark:text-white/70">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${styles.bar}`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
