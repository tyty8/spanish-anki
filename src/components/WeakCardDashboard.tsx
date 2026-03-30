"use client";

import type { Card } from "@/data/cards";
import type { CardProgress } from "@/lib/srs";

interface Props {
  weakCardIds: string[];
  cards: Card[];
  progress: Record<string, CardProgress>;
  onDrill: () => void;
}

export default function WeakCardDashboard({
  weakCardIds,
  cards,
  progress,
  onDrill,
}: Props) {
  if (weakCardIds.length === 0) {
    return null;
  }

  const weakCards = weakCardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Trouble Cards
        </h2>
        <button
          onClick={onDrill}
          className="text-xs px-3 py-1 rounded-full bg-red-600 text-white font-medium active:bg-red-700"
        >
          Drill these
        </button>
      </div>
      <div className="space-y-1">
        {weakCards.map((card) => {
          if (!card) return null;
          const p = progress[card.id];
          return (
            <div
              key={card.id}
              className="bg-slate-800 rounded-xl px-3 py-2 flex items-center justify-between"
            >
              <span className="text-sm text-slate-300 truncate flex-1 mr-2">
                {card.front}
              </span>
              {p && p.lapses > 0 && (
                <span className="text-xs text-red-400 whitespace-nowrap">
                  {p.lapses}x wrong
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
