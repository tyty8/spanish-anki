"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cards, allTags, type Card } from "@/data/cards";
import {
  loadAllProgress,
  saveAllProgress,
  getCardProgress,
  reviewCard,
  getDueCardIds,
  getExtraStudyIds,
  getStats,
  type CardProgress,
  type Rating,
} from "@/lib/srs";

type View = "home" | "study" | "stats";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProgress(loadAllProgress());
    setLoaded(true);
  }, []);

  const filteredCards = useMemo(() => {
    if (selectedTags.size === 0) return cards;
    return cards.filter((c) => c.tags.some((t) => selectedTags.has(t)));
  }, [selectedTags]);

  const filteredIds = useMemo(() => filteredCards.map((c) => c.id), [filteredCards]);

  const stats = useMemo(
    () => (loaded ? getStats(progress, filteredIds) : null),
    [progress, filteredIds, loaded]
  );

  const handleReview = useCallback(
    (cardId: string, rating: Rating) => {
      setProgress((prev) => {
        const cardProg = getCardProgress(prev, cardId);
        const updated = reviewCard(cardProg, rating);
        const next = { ...prev, [cardId]: updated };
        saveAllProgress(next);
        return next;
      });
    },
    []
  );

  if (!loaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (view === "study") {
    return (
      <StudyView
        cards={filteredCards}
        progress={progress}
        onReview={handleReview}
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "stats") {
    return (
      <StatsView
        progress={progress}
        cards={cards}
        onBack={() => setView("home")}
        onReset={() => {
          setProgress({});
          saveAllProgress({});
          setView("home");
        }}
      />
    );
  }

  return (
    <HomeView
      stats={stats!}
      selectedTags={selectedTags}
      onToggleTag={(tag) => {
        setSelectedTags((prev) => {
          const next = new Set(prev);
          if (next.has(tag)) next.delete(tag);
          else next.add(tag);
          return next;
        });
      }}
      onClearTags={() => setSelectedTags(new Set())}
      onStudy={() => setView("study")}
      onStats={() => setView("stats")}
    />
  );
}

// ─── Home View ───

function HomeView({
  stats,
  selectedTags,
  onToggleTag,
  onClearTags,
  onStudy,
  onStats,
}: {
  stats: ReturnType<typeof getStats>;
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  onStudy: () => void;
  onStats: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center">
        <h1 className="text-3xl font-bold">Spanish Cards</h1>
        <p className="text-slate-400 mt-1">Spaced repetition flashcards</p>
      </div>

      {/* Stats bar */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <StatBox label="Due" value={stats.due} color="text-orange-400" />
          <StatBox label="New" value={stats.newCount} color="text-blue-400" />
          <StatBox label="Learning" value={stats.learning} color="text-red-400" />
          <StatBox label="Mature" value={stats.mature} color="text-green-400" />
        </div>
      </div>

      {/* Tags */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Filter by topic
          </h2>
          {selectedTags.size > 0 && (
            <button
              onClick={onClearTags}
              className="text-xs text-slate-500 underline"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedTags.has(tag)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 active:bg-slate-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-6 space-y-3">
        <button
          onClick={onStudy}
          disabled={stats.due === 0 && stats.newCount === 0}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold active:bg-blue-700 disabled:opacity-40 disabled:active:bg-blue-600 transition-colors"
        >
          Study ({stats.due > 0 ? `${stats.due} due` : `${stats.newCount} new`})
        </button>
        <button
          onClick={onStats}
          className="w-full py-3 rounded-2xl bg-slate-800 text-slate-300 font-medium active:bg-slate-700 transition-colors"
        >
          Progress
        </button>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-slate-800 rounded-xl py-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

// ─── Study View ───

function StudyView({
  cards: filteredCards,
  progress,
  onReview,
  onBack,
}: {
  cards: Card[];
  progress: Record<string, CardProgress>;
  onReview: (cardId: string, rating: Rating) => void;
  onBack: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [animClass, setAnimClass] = useState("card-next");
  const [sessionDone, setSessionDone] = useState(0);
  const [extraStudy, setExtraStudy] = useState(false);
  const [extraIndex, setExtraIndex] = useState(0);

  const allIds = useMemo(() => filteredCards.map((c) => c.id), [filteredCards]);

  const dueIds = useMemo(
    () => getDueCardIds(progress, allIds),
    [progress, allIds]
  );

  const extraIds = useMemo(
    () => (extraStudy ? getExtraStudyIds(progress, allIds) : []),
    [extraStudy, progress, allIds]
  );

  const currentCard = useMemo(() => {
    if (!extraStudy) {
      if (dueIds.length === 0) return null;
      return filteredCards.find((c) => c.id === dueIds[0]) || null;
    }
    // Extra study: cycle through weakest cards
    if (extraIds.length === 0) return null;
    const id = extraIds[extraIndex % extraIds.length];
    return filteredCards.find((c) => c.id === id) || null;
  }, [dueIds, extraIds, extraStudy, extraIndex, filteredCards]);

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!currentCard) return;
      setAnimClass("card-exit");
      setTimeout(() => {
        onReview(currentCard.id, rating);
        setFlipped(false);
        setAnimClass("card-next");
        setSessionDone((d) => d + 1);
        if (extraStudy) setExtraIndex((i) => i + 1);
      }, 200);
    },
    [currentCard, onReview, extraStudy]
  );

  // Session complete
  if (!currentCard) {
    const canStudyMore = !extraStudy && allIds.some((id) => progress[id]?.repetitions > 0);
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center fade-in">
        <div className="text-5xl mb-4">{extraStudy ? "💪" : "🎉"}</div>
        <h2 className="text-2xl font-bold mb-2">
          {extraStudy ? "Extra Session Done!" : "Session Complete!"}
        </h2>
        <p className="text-slate-400 mb-2">
          You reviewed {sessionDone} card{sessionDone !== 1 ? "s" : ""}
        </p>
        {canStudyMore && (
          <button
            onClick={() => {
              setExtraStudy(true);
              setExtraIndex(0);
              setSessionDone(0);
            }}
            className="mt-4 px-8 py-3 rounded-2xl bg-orange-600 text-white font-bold active:bg-orange-700"
          >
            Study More (weakest cards)
          </button>
        )}
        <button
          onClick={onBack}
          className="mt-3 px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold active:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          className="text-slate-400 active:text-white px-2 py-1"
        >
          &larr; Back
        </button>
        <div className="text-slate-500 text-sm">
          {sessionDone} done {extraStudy
            ? <>&middot; <span className="text-orange-400">extra</span></>
            : <>&middot; {dueIds.length} left</>}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div
          key={currentCard.id + (flipped ? "-back" : "-front")}
          className={`w-full max-w-sm ${animClass}`}
        >
          <button
            onClick={() => !flipped && setFlipped(true)}
            className="w-full min-h-[280px] bg-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center active:bg-slate-750 transition-colors"
          >
            {!flipped ? (
              <>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">
                  {currentCard.tags.join(" / ")}
                </div>
                <div className="text-xl font-semibold leading-relaxed">
                  {currentCard.front}
                </div>
                <div className="text-slate-600 text-sm mt-6">Tap to reveal</div>
              </>
            ) : (
              <div className="card-flip">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">
                  Answer
                </div>
                <div className="text-xl font-semibold leading-relaxed text-green-400">
                  {currentCard.back}
                </div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="px-4 pb-8 pt-4">
        {flipped ? (
          <div className="grid grid-cols-4 gap-2">
            <RatingButton rating={0} label="Again" color="bg-red-600 active:bg-red-700" onRate={handleRate} />
            <RatingButton rating={1} label="Hard" color="bg-orange-600 active:bg-orange-700" onRate={handleRate} />
            <RatingButton rating={2} label="Good" color="bg-green-600 active:bg-green-700" onRate={handleRate} />
            <RatingButton rating={3} label="Easy" color="bg-blue-600 active:bg-blue-700" onRate={handleRate} />
          </div>
        ) : (
          <div className="text-center text-slate-600 text-sm py-4">
            Tap the card to see the answer
          </div>
        )}
      </div>
    </div>
  );
}

function RatingButton({
  rating,
  label,
  color,
  onRate,
}: {
  rating: Rating;
  label: string;
  color: string;
  onRate: (r: Rating) => void;
}) {
  return (
    <button
      onClick={() => onRate(rating)}
      className={`py-3 rounded-xl text-white font-bold text-sm ${color} transition-colors`}
    >
      {label}
    </button>
  );
}

// ─── Stats View ───

function StatsView({
  progress,
  cards: allCards,
  onBack,
  onReset,
}: {
  progress: Record<string, CardProgress>;
  cards: Card[];
  onBack: () => void;
  onReset: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const stats = getStats(
    progress,
    allCards.map((c) => c.id)
  );

  // Per-tag stats
  const tagStats = useMemo(() => {
    const map: Record<string, { total: number; learned: number; mature: number }> = {};
    for (const card of allCards) {
      for (const tag of card.tags) {
        if (!map[tag]) map[tag] = { total: 0, learned: 0, mature: 0 };
        map[tag].total++;
        const p = progress[card.id];
        if (p && p.repetitions > 0) map[tag].learned++;
        if (p && p.interval >= 21) map[tag].mature++;
      }
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [progress, allCards]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          className="text-slate-400 active:text-white px-2 py-1"
        >
          &larr; Back
        </button>
        <h2 className="flex-1 text-center font-bold text-lg pr-12">Progress</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Overall */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-xs text-slate-500 mt-1">Total Cards</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">{stats.due}</div>
            <div className="text-xs text-slate-500 mt-1">Due Now</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.mature}</div>
            <div className="text-xs text-slate-500 mt-1">Mature (21d+)</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{stats.learning}</div>
            <div className="text-xs text-slate-500 mt-1">Learning</div>
          </div>
        </div>

        {/* By tag */}
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-8 mb-3">
          By Topic
        </h3>
        <div className="space-y-2">
          {tagStats.map(([tag, s]) => (
            <div key={tag} className="bg-slate-800 rounded-xl px-4 py-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium">{tag}</span>
                <span className="text-xs text-slate-500">
                  {s.learned}/{s.total}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${s.total > 0 ? (s.learned / s.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Reset */}
        <div className="mt-8 text-center">
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-sm text-slate-600 underline"
            >
              Reset all progress
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-400">Are you sure? This cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold"
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
