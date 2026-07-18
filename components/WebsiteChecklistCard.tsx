import { Check, X } from "lucide-react";
import type { ChecklistGroup } from "@/lib/types";

export function WebsiteChecklistCard({ groups }: { groups: ChecklistGroup[] }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <h3 className="mb-1 font-semibold">Website checklist</h3>
      <p className="mb-5 text-sm text-black/45 dark:text-white/40">
        Pulled live from the site&apos;s HTML — not every check applies to every business.
      </p>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/40 dark:text-white/35">
              {group.title}
            </h4>
            <ul className="space-y-1.5">
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
                      <span className="text-black/40 dark:text-white/35"> — {item.detail}</span>
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
