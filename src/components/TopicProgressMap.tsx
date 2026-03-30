"use client";

import { useMemo } from "react";
import type { Card } from "@/data/cards";
import type { CardProgress } from "@/lib/srs";

interface Props {
  cards: Card[];
  progress: Record<string, CardProgress>;
  onSelectTag?: (tag: string) => void;
}

export default function TopicProgressMap({
  cards,
  progress,
  onSelectTag,
}: Props) {
  const tagStats = useMemo(() => {
    const map: Record<
      string,
      { total: number; learned: number; mature: number }
    > = {};
    for (const card of cards) {
      for (const tag of card.tags) {
        if (!map[tag]) map[tag] = { total: 0, learned: 0, mature: 0 };
        map[tag].total++;
        const p = progress[card.id];
        if (p && p.repetitions > 0) map[tag].learned++;
        if (p && p.interval >= 21) map[tag].mature++;
      }
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [cards, progress]);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
        Topic Progress
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {tagStats.map(([tag, s]) => {
          const pct = s.total > 0 ? (s.learned / s.total) * 100 : 0;
          const maturePct = s.total > 0 ? (s.mature / s.total) * 100 : 0;
          const status =
            maturePct === 100
              ? "mastered"
              : s.learned > 0
              ? "learning"
              : "new";

          return (
            <button
              key={tag}
              onClick={() => onSelectTag?.(tag)}
              className={`bg-slate-800 rounded-xl p-3 text-left transition-colors active:bg-slate-700 border-2 ${
                status === "mastered"
                  ? "border-green-500/50"
                  : status === "learning"
                  ? "border-orange-500/30"
                  : "border-transparent"
              }`}
            >
              <div className="text-sm font-medium truncate">{tag}</div>
              <div className="text-xs text-slate-500 mt-1">
                {s.learned}/{s.total}
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    status === "mastered" ? "bg-green-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
