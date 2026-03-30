// Session mode card selection logic

import { getDueCardIds } from "./srs";
import type { CardProgress } from "./srs";
import { getWeakCards } from "./stats";
import type { Card } from "@/data/cards";

export type SessionMode = "quick" | "deep" | "new-topic";

export interface SessionConfig {
  mode: SessionMode;
  cardIds: string[];
  typingEnabled: boolean;
  timeLimit: number; // minutes
}

export function getQuickReviewConfig(
  progress: Record<string, CardProgress>,
  cardIds: string[]
): SessionConfig {
  const due = getDueCardIds(progress, cardIds).slice(0, 15);
  return {
    mode: "quick",
    cardIds: due,
    typingEnabled: false,
    timeLimit: 5,
  };
}

export function getDeepPracticeConfig(
  progress: Record<string, CardProgress>,
  cardIds: string[]
): SessionConfig {
  const due = getDueCardIds(progress, cardIds);
  const weak = getWeakCards(progress, cardIds, 10);

  // Interleave due and weak cards, dedup
  const seen = new Set<string>();
  const merged: string[] = [];

  const sources = [due, weak];
  let idx = 0;
  while (merged.length < 30 && (due.length > 0 || weak.length > 0)) {
    const source = sources[idx % 2];
    const card = source.shift();
    if (card && !seen.has(card)) {
      seen.add(card);
      merged.push(card);
    }
    idx++;
    if (due.length === 0 && weak.length === 0) break;
  }

  return {
    mode: "deep",
    cardIds: merged,
    typingEnabled: true,
    timeLimit: 15,
  };
}

export function getNewTopicConfig(
  progress: Record<string, CardProgress>,
  allCards: Card[],
  tag: string
): SessionConfig {
  const tagCards = allCards
    .filter((c) => c.tags.includes(tag))
    .map((c) => c.id);

  // Prioritize new cards, then low-rep cards
  const sorted = tagCards.sort((a, b) => {
    const pa = progress[a];
    const pb = progress[b];
    const repA = pa ? pa.repetitions : 0;
    const repB = pb ? pb.repetitions : 0;
    return repA - repB;
  });

  return {
    mode: "new-topic",
    cardIds: sorted.slice(0, 20),
    typingEnabled: true,
    timeLimit: 10,
  };
}
