// SM-2 Spaced Repetition Algorithm (same as Anki)

export interface CardProgress {
  cardId: string;
  easeFactor: number; // starts at 2.5
  interval: number; // days
  repetitions: number;
  nextReview: number; // timestamp
  lastReview: number; // timestamp
  lapses: number; // times "Again" was pressed
}

export type Rating = 0 | 1 | 2 | 3; // Again, Hard, Good, Easy

const RATING_LABELS: Record<Rating, string> = {
  0: "Again",
  1: "Hard",
  2: "Good",
  3: "Easy",
};

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

export function getNewProgress(cardId: string): CardProgress {
  return {
    cardId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: 0,
    lastReview: 0,
    lapses: 0,
  };
}

export function reviewCard(progress: CardProgress, rating: Rating): CardProgress {
  const now = Date.now();
  const p = { ...progress, lastReview: now };

  if (rating === 0) {
    // Again - reset
    p.repetitions = 0;
    p.interval = 0;
    p.lapses += 1;
    p.nextReview = now + 60 * 1000; // 1 minute
    p.easeFactor = Math.max(1.3, p.easeFactor - 0.2);
    return p;
  }

  // Adjust ease factor
  const q = rating + 2; // map 1,2,3 -> 3,4,5
  p.easeFactor = Math.max(
    1.3,
    p.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  if (rating === 1) {
    // Hard
    if (p.repetitions === 0) {
      p.interval = 1;
    } else {
      p.interval = Math.max(1, Math.round(p.interval * 1.2));
    }
  } else if (rating === 2) {
    // Good
    if (p.repetitions === 0) {
      p.interval = 1;
    } else if (p.repetitions === 1) {
      p.interval = 3;
    } else {
      p.interval = Math.round(p.interval * p.easeFactor);
    }
  } else {
    // Easy
    if (p.repetitions === 0) {
      p.interval = 4;
    } else {
      p.interval = Math.round(p.interval * p.easeFactor * 1.3);
    }
  }

  p.repetitions += 1;
  p.nextReview = now + p.interval * 24 * 60 * 60 * 1000;
  return p;
}

// Storage
const STORAGE_KEY = "spanish-srs-progress";

export function loadAllProgress(): Record<string, CardProgress> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveAllProgress(progress: Record<string, CardProgress>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getCardProgress(
  all: Record<string, CardProgress>,
  cardId: string
): CardProgress {
  return all[cardId] || getNewProgress(cardId);
}

// Get cards due for review, sorted by priority
export function getDueCardIds(
  all: Record<string, CardProgress>,
  cardIds: string[]
): string[] {
  const now = Date.now();

  // New cards (never reviewed)
  const newCards = cardIds.filter((id) => !all[id]);

  // Due cards (review time passed)
  const dueCards = cardIds
    .filter((id) => all[id] && all[id].nextReview <= now)
    .sort((a, b) => all[a].nextReview - all[b].nextReview);

  // Lapsed cards first, then due, then new
  const lapsed = dueCards.filter((id) => all[id]?.lapses > 0);
  const normalDue = dueCards.filter((id) => !all[id]?.lapses);

  return [...lapsed, ...normalDue, ...newCards];
}

export function getStats(
  all: Record<string, CardProgress>,
  cardIds: string[]
) {
  const now = Date.now();
  let newCount = 0;
  let learning = 0;
  let review = 0;
  let mature = 0;

  for (const id of cardIds) {
    const p = all[id];
    if (!p) {
      newCount++;
    } else if (p.interval === 0) {
      learning++;
    } else if (p.interval < 21) {
      review++;
    } else {
      mature++;
    }
  }

  const due = getDueCardIds(all, cardIds).length;

  return { newCount, learning, review, mature, due, total: cardIds.length };
}
