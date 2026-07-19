import { Check, X } from "lucide-react";
import type { ReportSection } from "@/lib/types";

export function ChecklistSectionCard({
  section,
  title,
  description,
  skipGroupTitles = [],
}: {
  section: ReportSection;
  title: string;
  description: string;
  skipGroupTitles?: string[];
}) {
  const groups = section.groups.filter((g) => !skipGroupTitles.includes(g.title));
  if (groups.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-black/45 dark:text-white/40">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-semibold tabular-nums text-black/55 dark:bg-white/[0.06] dark:text-white/50">
          {section.score}/{section.maxScore}
        </span>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/40 dark:text-white/35">
              {group.title}
            </h4>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5 text-sm">
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      item.passed
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/15 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {item.passed ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                  </span>
                  <span className="text-black/70 dark:text-white/65">
                    {item.label}
                    {item.detail && (
                      <span className="block text-xs text-black/40 dark:text-white/35">
                        {item.detail}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
