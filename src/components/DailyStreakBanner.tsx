"use client";

interface Props {
  streak: number;
  todayReviewed: number;
  todayAccuracy: number;
}

export default function DailyStreakBanner({
  streak,
  todayReviewed,
  todayAccuracy,
}: Props) {
  return (
    <div className="bg-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-orange-400 font-bold text-lg">
          {streak > 0 ? `${streak} day${streak !== 1 ? "s" : ""}` : "No streak"}
        </span>
        {streak > 0 && <span className="text-sm">🔥</span>}
      </div>
      <div className="text-sm text-slate-400">
        {todayReviewed > 0 ? (
          <>
            Today: {todayReviewed} cards{" "}
            <span
              className={
                todayAccuracy >= 80 ? "text-green-400" : "text-yellow-400"
              }
            >
              {todayAccuracy}%
            </span>
          </>
        ) : (
          <span className="text-slate-500">Start studying!</span>
        )}
      </div>
    </div>
  );
}
