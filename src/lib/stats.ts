// Streak, statistics, and error pattern tracking

import { loadJSON, saveJSON, getToday, getYesterday } from "./storage";
import type { CardProgress } from "./srs";

// ─── Types ───

interface DailyStats {
  reviewed: number;
  correct: number;
  newLearned: number;
}

interface StreakData {
  currentStreak: number;
  lastStudyDate: string;
  longestStreak: number;
}

interface ErrorPatternData {
  [category: string]: { count: number; lastSeen: number };
}

// ─── Keys ───

const DAILY_KEY = "spanish-daily-stats";
const STREAK_KEY = "spanish-streak";
const ERROR_KEY = "spanish-error-patterns";

// ─── Daily Stats ───

function getDailyData(): Record<string, DailyStats> {
  return loadJSON(DAILY_KEY, {});
}

function saveDailyData(data: Record<string, DailyStats>): void {
  saveJSON(DAILY_KEY, data);
}

function ensureToday(data: Record<string, DailyStats>): DailyStats {
  const today = getToday();
  if (!data[today]) {
    data[today] = { reviewed: 0, correct: 0, newLearned: 0 };
  }
  return data[today];
}

export function recordReview(correct: boolean): void {
  const data = getDailyData();
  const today = ensureToday(data);
  today.reviewed++;
  if (correct) today.correct++;
  saveDailyData(data);
  updateStreak();
}

export function recordNewLearned(): void {
  const data = getDailyData();
  const today = ensureToday(data);
  today.newLearned++;
  saveDailyData(data);
}

export function getTodayStats(): {
  reviewed: number;
  correct: number;
  newLearned: number;
  accuracy: number;
} {
  const data = getDailyData();
  const today = getToday();
  const stats = data[today] || { reviewed: 0, correct: 0, newLearned: 0 };
  return {
    ...stats,
    accuracy: stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0,
  };
}

export function getWeeklyStats(): {
  reviewed: number;
  correct: number;
  accuracy: number;
  dailyBreakdown: { date: string; reviewed: number; correct: number }[];
} {
  const data = getDailyData();
  const breakdown: { date: string; reviewed: number; correct: number }[] = [];
  let totalReviewed = 0;
  let totalCorrect = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const stats = data[dateStr] || { reviewed: 0, correct: 0 };
    breakdown.push({ date: dateStr, reviewed: stats.reviewed, correct: stats.correct });
    totalReviewed += stats.reviewed;
    totalCorrect += stats.correct;
  }

  return {
    reviewed: totalReviewed,
    correct: totalCorrect,
    accuracy: totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0,
    dailyBreakdown: breakdown,
  };
}

// ─── Streak ───

function updateStreak(): void {
  const today = getToday();
  const yesterday = getYesterday();
  const streak = loadJSON<StreakData>(STREAK_KEY, {
    currentStreak: 0,
    lastStudyDate: "",
    longestStreak: 0,
  });

  if (streak.lastStudyDate === today) {
    // Already updated today
    return;
  }

  if (streak.lastStudyDate === yesterday) {
    streak.currentStreak++;
  } else if (streak.lastStudyDate !== today) {
    streak.currentStreak = 1;
  }

  streak.lastStudyDate = today;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  saveJSON(STREAK_KEY, streak);
}

export function getStreak(): { current: number; longest: number; lastDate: string } {
  const today = getToday();
  const yesterday = getYesterday();
  const streak = loadJSON<StreakData>(STREAK_KEY, {
    currentStreak: 0,
    lastStudyDate: "",
    longestStreak: 0,
  });

  // If last study was before yesterday, streak is broken
  if (streak.lastStudyDate !== today && streak.lastStudyDate !== yesterday) {
    return { current: 0, longest: streak.longestStreak, lastDate: streak.lastStudyDate };
  }

  return {
    current: streak.currentStreak,
    longest: streak.longestStreak,
    lastDate: streak.lastStudyDate,
  };
}

// ─── Error Patterns ───

export function recordError(category: string): void {
  const data = loadJSON<ErrorPatternData>(ERROR_KEY, {});
  if (!data[category]) {
    data[category] = { count: 0, lastSeen: 0 };
  }
  data[category].count++;
  data[category].lastSeen = Date.now();
  saveJSON(ERROR_KEY, data);
}

export function getErrorPatterns(): { category: string; count: number; lastSeen: number }[] {
  const data = loadJSON<ErrorPatternData>(ERROR_KEY, {});
  return Object.entries(data)
    .map(([category, { count, lastSeen }]) => ({ category, count, lastSeen }))
    .sort((a, b) => b.count - a.count);
}

// ─── Weak Cards ───

export function getWeakCards(
  progress: Record<string, CardProgress>,
  cardIds: string[],
  limit: number
): string[] {
  const reviewed = cardIds.filter(
    (id) => progress[id] && progress[id].repetitions > 0
  );

  return reviewed
    .sort((a, b) => {
      const pa = progress[a];
      const pb = progress[b];
      // Highest lapses first
      if (pa.lapses !== pb.lapses) return pb.lapses - pa.lapses;
      // Then lowest ease factor
      if (pa.easeFactor !== pb.easeFactor) return pa.easeFactor - pb.easeFactor;
      // Then shortest interval
      return pa.interval - pb.interval;
    })
    .slice(0, limit);
}
