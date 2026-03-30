"use client";

interface Props {
  onSelect: (mode: "quick" | "deep" | "new-topic") => void;
  dueCount: number;
  weakCount: number;
  newCount: number;
}

export default function SessionModeSelector({
  onSelect,
  dueCount,
  weakCount,
  newCount,
}: Props) {
  return (
    <div className="space-y-3">
      <button
        onClick={() => onSelect("quick")}
        disabled={dueCount === 0 && newCount === 0}
        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold active:bg-blue-700 disabled:opacity-40 transition-colors text-left px-6"
      >
        <div className="text-lg">Quick Review</div>
        <div className="text-sm font-normal text-blue-200">
          5 min · {dueCount > 0 ? `${dueCount} due` : `${newCount} new`} cards
        </div>
      </button>

      <button
        onClick={() => onSelect("deep")}
        disabled={dueCount === 0 && weakCount === 0}
        className="w-full py-4 rounded-2xl bg-orange-600 text-white font-bold active:bg-orange-700 disabled:opacity-40 transition-colors text-left px-6"
      >
        <div className="text-lg">Deep Practice</div>
        <div className="text-sm font-normal text-orange-200">
          15 min · typing mode · {weakCount} weak cards
        </div>
      </button>

      <button
        onClick={() => onSelect("new-topic")}
        disabled={newCount === 0}
        className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold active:bg-green-700 disabled:opacity-40 transition-colors text-left px-6"
      >
        <div className="text-lg">New Topic</div>
        <div className="text-sm font-normal text-green-200">
          10 min · {newCount} new cards to learn
        </div>
      </button>
    </div>
  );
}
