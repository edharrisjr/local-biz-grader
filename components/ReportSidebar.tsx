import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import type { ReportSection } from "@/lib/types";
import { scoreLabel, totalSectionScore } from "@/lib/scoring-sections";

function scoreColor(score: number, maxScore: number): string {
  const pct = (score / maxScore) * 100;
  if (pct >= 85) return "text-emerald-500";
  if (pct >= 70) return "text-lime-500";
  if (pct >= 50) return "text-amber-500";
  return "text-red-500";
}

function SectionStatusIcon({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = (score / maxScore) * 100;
  if (pct >= 85) return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (pct >= 50) return <CircleAlert size={14} className="text-amber-500" />;
  return <XCircle size={14} className="text-red-500" />;
}

function sectionStatusLabel(score: number, maxScore: number): string {
  const pct = (score / maxScore) * 100;
  if (pct >= 85) return "Great";
  if (pct >= 50) return "Fair";
  return "Poor";
}

export function ReportSidebar({ sections }: { sections: ReportSection[] }) {
  const overallScore = totalSectionScore(sections);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - overallScore / 100);
  const color = scoreColor(overallScore, 100);

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-8 lg:w-64 lg:shrink-0">
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              strokeWidth="8"
              className="fill-none stroke-black/10 dark:stroke-white/10"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`fill-none ${color} transition-all duration-1000 ease-out`}
              stroke="currentColor"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-3xl font-extrabold tabular-nums ${color}`}>{overallScore}</span>
            <span className="text-xs text-black/40 dark:text-white/40">/100</span>
          </div>
        </div>
        <p className={`text-sm font-semibold ${color}`}>{scoreLabel(overallScore)}</p>
        <p className="text-xs text-black/40 dark:text-white/40">Online health grade</p>
      </div>

      <ul className="space-y-1">
        {sections.map((section) => (
          <li
            key={section.id}
            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              <SectionStatusIcon score={section.score} maxScore={section.maxScore} />
              <span className="truncate text-black/75 dark:text-white/70">{section.label}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="tabular-nums text-black/45 dark:text-white/40">
                {section.score}/{section.maxScore}
              </span>
              <span className={`text-xs font-medium ${scoreColor(section.score, section.maxScore)}`}>
                {sectionStatusLabel(section.score, section.maxScore)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
