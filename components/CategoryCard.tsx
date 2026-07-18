import type { CategoryScore } from "@/lib/types";

function barColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function CategoryCard({ category }: { category: CategoryScore }) {
  return (
    <div className="rounded-xl border border-black/10 p-5 dark:border-white/10">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">{category.label}</h3>
        <span className="text-sm font-medium text-black/60 dark:text-white/60">
          {category.score}/100
        </span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className={`h-full ${barColor(category.score)}`}
          style={{ width: `${category.score}%` }}
        />
      </div>
      <p className="mb-2 text-sm text-black/60 dark:text-white/60">{category.summary}</p>
      <ul className="space-y-1 text-sm">
        {category.findings.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-black/30 dark:text-white/30">&bull;</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
