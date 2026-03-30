"use client";

interface Props {
  patterns: { category: string; count: number }[];
}

const categoryLabels: Record<string, string> = {
  "accent-missing": "Missing Accents",
  "gender-error": "Gender Errors",
  "era-estaba": "Era vs Estaba",
  "por-para": "Por vs Para",
  spelling: "Spelling",
  "verb-form": "Verb Forms",
};

export default function ErrorPatternDashboard({ patterns }: Props) {
  if (patterns.length === 0) {
    return null;
  }

  const maxCount = Math.max(...patterns.map((p) => p.count), 1);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
        Error Patterns
      </h2>
      <div className="space-y-2">
        {patterns.slice(0, 8).map(({ category, count }) => {
          const pct = (count / maxCount) * 100;
          const barColor =
            count > 20
              ? "bg-red-500"
              : count > 10
              ? "bg-orange-500"
              : count > 5
              ? "bg-yellow-500"
              : "bg-slate-500";

          return (
            <div key={category} className="bg-slate-800 rounded-xl px-3 py-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-300">
                  {categoryLabels[category] || category}
                </span>
                <span className="text-xs text-slate-500">{count}x</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className={`${barColor} h-1.5 rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
