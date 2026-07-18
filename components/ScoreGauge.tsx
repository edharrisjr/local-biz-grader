function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-emerald-500";
    case "B":
      return "text-lime-500";
    case "C":
      return "text-amber-500";
    case "D":
      return "text-orange-500";
    default:
      return "text-red-500";
  }
}

function gradeGlow(grade: string): string {
  switch (grade) {
    case "A":
      return "shadow-emerald-500/20";
    case "B":
      return "shadow-lime-500/20";
    case "C":
      return "shadow-amber-500/20";
    case "D":
      return "shadow-orange-500/20";
    default:
      return "shadow-red-500/20";
  }
}

export function ScoreGauge({
  score,
  grade,
  benchmark,
}: {
  score: number;
  grade: string;
  benchmark?: number;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const benchmarkAngle = benchmark != null ? (benchmark / 100) * 360 - 90 : null;
  const benchmarkPoint =
    benchmarkAngle != null
      ? {
          x: 60 + radius * Math.cos((benchmarkAngle * Math.PI) / 180),
          y: 60 + radius * Math.sin((benchmarkAngle * Math.PI) / 180),
        }
      : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-black/40 dark:text-white/40">
        Your Score
      </p>
      <div
        className={`relative flex h-44 w-44 items-center justify-center rounded-full shadow-2xl ${gradeGlow(grade)}`}
      >
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            strokeWidth="10"
            className="fill-none stroke-black/10 dark:stroke-white/10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`fill-none ${gradeColor(grade)} transition-all duration-1000 ease-out`}
            stroke="currentColor"
          />
        </svg>
        {benchmarkPoint && (
          <div
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/60 dark:border-black dark:bg-white/80"
            style={{ left: `${(benchmarkPoint.x / 120) * 100}%`, top: `${(benchmarkPoint.y / 120) * 100}%` }}
            title={`Typical local business: ${benchmark}/100`}
          />
        )}
        <div className="absolute flex flex-col items-center">
          <span className={`text-5xl font-extrabold tabular-nums ${gradeColor(grade)}`}>{grade}</span>
          <span className="text-sm font-medium text-black/50 dark:text-white/50">{score}/100</span>
        </div>
      </div>
      {benchmark != null && (
        <p className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
          <span className="inline-block h-2 w-2 rounded-full border border-black/60 bg-black/60 dark:border-white/80 dark:bg-white/80" />
          Typical local business scores {benchmark}/100
        </p>
      )}
    </div>
  );
}
