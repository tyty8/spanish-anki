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
import {
  classifyErrors,
  extractBlankAnswer,
  type MatchResult,
} from "@/lib/matching";
import {
  recordReview,
  recordError,
  getTodayStats,
  getStreak,
  getErrorPatterns,
  getWeakCards,
} from "@/lib/stats";
import {
  getQuickReviewConfig,
  getDeepPracticeConfig,
  getNewTopicConfig,
  type SessionMode,
  type SessionConfig,
} from "@/lib/sessionModes";
import TypingInput from "@/components/TypingInput";
import FillInBlank from "@/components/FillInBlank";
import AudioButton from "@/components/AudioButton";
import DailyStreakBanner from "@/components/DailyStreakBanner";
import WeakCardDashboard from "@/components/WeakCardDashboard";
import SessionModeSelector from "@/components/SessionModeSelector";
import TopicProgressMap from "@/components/TopicProgressMap";
import ErrorPatternDashboard from "@/components/ErrorPatternDashboard";

type View = "home" | "study" | "stats" | "topics" | "pick-tag";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [loaded, setLoaded] = useState(false);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);

  useEffect(() => {
    setProgress(loadAllProgress());
    setLoaded(true);
  }, []);

  const allIds = useMemo(() => cards.map((c) => c.id), []);

  const stats = useMemo(
    () => (loaded ? getStats(progress, allIds) : null),
    [progress, allIds, loaded]
  );

  const weakCardIds = useMemo(
    () => (loaded ? getWeakCards(progress, allIds, 10) : []),
    [progress, allIds, loaded]
  );

  const handleReview = useCallback((cardId: string, rating: Rating) => {
    setProgress((prev) => {
      const cardProg = getCardProgress(prev, cardId);
      const updated = reviewCard(cardProg, rating);
      const next = { ...prev, [cardId]: updated };
      saveAllProgress(next);
      return next;
    });
    recordReview(rating >= 2);
  }, []);

  const startSession = useCallback(
    (mode: SessionMode) => {
      let config: SessionConfig;
      if (mode === "quick") {
        config = getQuickReviewConfig(progress, allIds);
      } else if (mode === "deep") {
        config = getDeepPracticeConfig(progress, allIds);
      } else {
        // new-topic needs tag selection first
        setView("pick-tag");
        return;
      }
      setSessionConfig(config);
      setView("study");
    },
    [progress, allIds]
  );

  const startTagSession = useCallback(
    (tag: string) => {
      const config = getNewTopicConfig(progress, cards, tag);
      setSessionConfig(config);
      setView("study");
    },
    [progress]
  );

  if (!loaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (view === "study" && sessionConfig) {
    return (
      <StudyView
        cards={cards}
        sessionConfig={sessionConfig}
        progress={progress}
        onReview={handleReview}
        onBack={() => {
          setView("home");
          setSessionConfig(null);
        }}
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

  if (view === "topics") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center px-4 pt-4 pb-2">
          <button
            onClick={() => setView("home")}
            className="text-slate-400 active:text-white px-2 py-1"
          >
            &larr; Back
          </button>
          <h2 className="flex-1 text-center font-bold text-lg pr-12">
            Topics
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <TopicProgressMap
            cards={cards}
            progress={progress}
            onSelectTag={startTagSession}
          />
        </div>
      </div>
    );
  }

  if (view === "pick-tag") {
    return (
      <TagPicker
        cards={cards}
        progress={progress}
        onSelect={startTagSession}
        onBack={() => setView("home")}
      />
    );
  }

  return (
    <HomeView
      stats={stats!}
      progress={progress}
      weakCardIds={weakCardIds}
      onStartSession={startSession}
      onDrillWeak={() => {
        setSessionConfig({
          mode: "deep",
          cardIds: weakCardIds,
          typingEnabled: true,
          timeLimit: 10,
        });
        setView("study");
      }}
      onStats={() => setView("stats")}
      onTopics={() => setView("topics")}
    />
  );
}

// ─── Home View ───

function HomeView({
  stats,
  progress,
  weakCardIds,
  onStartSession,
  onDrillWeak,
  onStats,
  onTopics,
}: {
  stats: ReturnType<typeof getStats>;
  progress: Record<string, CardProgress>;
  weakCardIds: string[];
  onStartSession: (mode: SessionMode) => void;
  onDrillWeak: () => void;
  onStats: () => void;
  onTopics: () => void;
}) {
  const streak = getStreak();
  const todayStats = getTodayStats();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 px-6 text-center">
        <h1 className="text-3xl font-bold">Spanish Cards</h1>
        <p className="text-slate-400 mt-1 text-sm">A2/B1 → C1</p>
      </div>

      {/* Streak Banner */}
      <div className="px-6 pb-3">
        <DailyStreakBanner
          streak={streak.current}
          todayReviewed={todayStats.reviewed}
          todayAccuracy={todayStats.accuracy}
        />
      </div>

      {/* Stats bar */}
      <div className="px-6 pb-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          <StatBox label="Due" value={stats.due} color="text-orange-400" />
          <StatBox label="New" value={stats.newCount} color="text-blue-400" />
          <StatBox label="Learning" value={stats.learning} color="text-red-400" />
          <StatBox label="Mature" value={stats.mature} color="text-green-400" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
        {/* Weak cards */}
        <WeakCardDashboard
          weakCardIds={weakCardIds}
          cards={cards}
          progress={progress}
          onDrill={onDrillWeak}
        />
      </div>

      {/* Session mode buttons */}
      <div className="p-6 space-y-2">
        <SessionModeSelector
          onSelect={onStartSession}
          dueCount={stats.due}
          weakCount={weakCardIds.length}
          newCount={stats.newCount}
        />
        <div className="flex gap-2">
          <button
            onClick={onStats}
            className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 font-medium active:bg-slate-700 transition-colors text-sm"
          >
            Progress
          </button>
          <button
            onClick={onTopics}
            className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 font-medium active:bg-slate-700 transition-colors text-sm"
          >
            Topics
          </button>
        </div>
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
  cards: allCards,
  sessionConfig,
  progress,
  onReview,
  onBack,
}: {
  cards: Card[];
  sessionConfig: SessionConfig;
  progress: Record<string, CardProgress>;
  onReview: (cardId: string, rating: Rating) => void;
  onBack: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [animClass, setAnimClass] = useState("card-next");
  const [sessionDone, setSessionDone] = useState(0);
  const [typingSubmitted, setTypingSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000 / 60));
    }, 10000);
    return () => clearInterval(timer);
  }, [startTime]);

  const cardIds = sessionConfig.cardIds;

  const currentCard = useMemo(() => {
    if (currentIndex >= cardIds.length) return null;
    return allCards.find((c) => c.id === cardIds[currentIndex]) || null;
  }, [currentIndex, cardIds, allCards]);

  const isBlankCard = currentCard?.front.includes("___") ?? false;
  const useTyping = sessionConfig.typingEnabled && !isBlankCard;

  const advance = useCallback(
    (rating: Rating) => {
      if (!currentCard) return;
      setAnimClass("card-exit");
      setTimeout(() => {
        onReview(currentCard.id, rating);
        setFlipped(false);
        setTypingSubmitted(false);
        setAnimClass("card-next");
        setSessionDone((d) => d + 1);
        setCurrentIndex((i) => i + 1);
      }, 200);
    },
    [currentCard, onReview]
  );

  const handleTypingSubmit = useCallback(
    (typed: string, result: MatchResult, rating: Rating) => {
      if (!currentCard) return;
      setTypingSubmitted(true);

      // Track errors
      const errors = classifyErrors(typed, currentCard.back, currentCard.tags);
      for (const err of errors) {
        recordError(err);
      }
    },
    [currentCard]
  );

  // Session complete
  if (!currentCard) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center fade-in">
        <div className="text-5xl mb-4">
          {sessionConfig.mode === "deep" ? "💪" : "🎉"}
        </div>
        <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
        <p className="text-slate-400 mb-2">
          You reviewed {sessionDone} card{sessionDone !== 1 ? "s" : ""} in{" "}
          {elapsed} min
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold active:bg-blue-700"
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
          {sessionDone} done · {cardIds.length - currentIndex} left
          {sessionConfig.timeLimit > 0 && (
            <span
              className={elapsed >= sessionConfig.timeLimit ? "text-red-400" : ""}
            >
              {" "}· {elapsed}/{sessionConfig.timeLimit}m
            </span>
          )}
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div
          key={currentCard.id + currentIndex}
          className={`w-full max-w-sm ${animClass}`}
        >
          {/* Flip mode (no typing) */}
          {!useTyping && !isBlankCard && (
            <button
              onClick={() => !flipped && setFlipped(true)}
              className="w-full min-h-[240px] bg-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center active:bg-slate-750 transition-colors"
            >
              {!flipped ? (
                <>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">
                    {currentCard.tags.join(" / ")}
                  </div>
                  <div className="text-xl font-semibold leading-relaxed">
                    {currentCard.front}
                  </div>
                  <div className="text-slate-600 text-sm mt-6">
                    Tap to reveal
                  </div>
                </>
              ) : (
                <div className="card-flip">
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">
                      Answer
                    </div>
                    <AudioButton cardId={currentCard.id} size="sm" />
                  </div>
                  <div className="text-xl font-semibold leading-relaxed text-green-400">
                    {currentCard.back}
                  </div>
                </div>
              )}
            </button>
          )}

          {/* Typing mode */}
          {useTyping && (
            <div className="bg-slate-800 rounded-3xl p-6 space-y-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider text-center">
                {currentCard.tags.join(" / ")}
              </div>
              <div className="text-xl font-semibold leading-relaxed text-center">
                {currentCard.front}
              </div>
              {typingSubmitted && (
                <div className="flex justify-center">
                  <AudioButton cardId={currentCard.id} size="sm" />
                </div>
              )}
              <TypingInput
                expected={currentCard.back}
                onSubmit={handleTypingSubmit}
              />
            </div>
          )}

          {/* Fill-in-blank mode */}
          {isBlankCard && (
            <div className="bg-slate-800 rounded-3xl p-6 space-y-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider text-center">
                {currentCard.tags.join(" / ")}
              </div>
              <FillInBlank
                front={currentCard.front}
                expected={extractBlankAnswer(currentCard.front, currentCard.back)}
                onSubmit={(typed, result, rating) => {
                  setTypingSubmitted(true);
                  const errors = classifyErrors(
                    typed,
                    extractBlankAnswer(currentCard.front, currentCard.back),
                    currentCard.tags
                  );
                  for (const err of errors) {
                    recordError(err);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Rating buttons */}
      <div className="px-4 pb-8 pt-4">
        {flipped || typingSubmitted ? (
          <div className="grid grid-cols-4 gap-2">
            <RatingButton
              rating={0}
              label="Again"
              color="bg-red-600 active:bg-red-700"
              onRate={advance}
            />
            <RatingButton
              rating={1}
              label="Hard"
              color="bg-orange-600 active:bg-orange-700"
              onRate={advance}
            />
            <RatingButton
              rating={2}
              label="Good"
              color="bg-green-600 active:bg-green-700"
              onRate={advance}
            />
            <RatingButton
              rating={3}
              label="Easy"
              color="bg-blue-600 active:bg-blue-700"
              onRate={advance}
            />
          </div>
        ) : (
          !useTyping &&
          !isBlankCard && (
            <div className="text-center text-slate-600 text-sm py-4">
              Tap the card to see the answer
            </div>
          )
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

// ─── Tag Picker ───

function TagPicker({
  cards: allCards,
  progress,
  onSelect,
  onBack,
}: {
  cards: Card[];
  progress: Record<string, CardProgress>;
  onSelect: (tag: string) => void;
  onBack: () => void;
}) {
  const tagInfo = useMemo(() => {
    const map: Record<string, { total: number; newCount: number }> = {};
    for (const card of allCards) {
      for (const tag of card.tags) {
        if (!map[tag]) map[tag] = { total: 0, newCount: 0 };
        map[tag].total++;
        if (!progress[card.id]) map[tag].newCount++;
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1].newCount - a[1].newCount)
      .filter(([, info]) => info.newCount > 0);
  }, [allCards, progress]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          className="text-slate-400 active:text-white px-2 py-1"
        >
          &larr; Back
        </button>
        <h2 className="flex-1 text-center font-bold text-lg pr-12">
          Pick a Topic
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
        {tagInfo.map(([tag, info]) => (
          <button
            key={tag}
            onClick={() => onSelect(tag)}
            className="w-full bg-slate-800 rounded-xl px-4 py-3 flex items-center justify-between active:bg-slate-700 transition-colors"
          >
            <span className="text-sm font-medium">{tag}</span>
            <span className="text-xs text-blue-400">
              {info.newCount} new / {info.total}
            </span>
          </button>
        ))}
        {tagInfo.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            All topics started! Use Deep Practice instead.
          </div>
        )}
      </div>
    </div>
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
  const errorPatterns = getErrorPatterns();
  const streak = getStreak();
  const todayStats = getTodayStats();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          className="text-slate-400 active:text-white px-2 py-1"
        >
          &larr; Back
        </button>
        <h2 className="flex-1 text-center font-bold text-lg pr-12">
          Progress
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Streak */}
        <div className="mt-4 bg-slate-800 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">
            {streak.current} {streak.current > 0 ? "🔥" : ""}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Day streak (best: {streak.longest})
          </div>
        </div>

        {/* Today */}
        <div className="mt-3 bg-slate-800 rounded-2xl p-4 text-center">
          <div className="text-lg font-bold text-blue-400">
            {todayStats.reviewed} cards · {todayStats.accuracy}% accuracy
          </div>
          <div className="text-xs text-slate-500 mt-1">Today</div>
        </div>

        {/* Overall */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {stats.total}
            </div>
            <div className="text-xs text-slate-500 mt-1">Total Cards</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">
              {stats.due}
            </div>
            <div className="text-xs text-slate-500 mt-1">Due Now</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {stats.mature}
            </div>
            <div className="text-xs text-slate-500 mt-1">Mature (21d+)</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">
              {stats.learning}
            </div>
            <div className="text-xs text-slate-500 mt-1">Learning</div>
          </div>
        </div>

        {/* Error Patterns */}
        <div className="mt-6">
          <ErrorPatternDashboard patterns={errorPatterns} />
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
              <p className="text-sm text-red-400">
                Are you sure? This cannot be undone.
              </p>
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
