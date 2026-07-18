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

export function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r="54"
          strokeWidth="10"
          className="fill-none stroke-black/10 dark:stroke-white/10"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`fill-none ${gradeColor(grade)} transition-all duration-700 ease-out`}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${gradeColor(grade)}`}>{grade}</span>
        <span className="text-sm text-black/60 dark:text-white/60">{score}/100</span>
      </div>
    </div>
  );
}
