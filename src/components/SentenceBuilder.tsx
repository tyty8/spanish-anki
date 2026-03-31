"use client";

import { useState, useRef, useCallback } from "react";
import type { WordBank, Tense, GeneratedSentence } from "@/lib/sentenceEngine";
import { generateSentence, scrambleWords } from "@/lib/sentenceEngine";

interface Props {
  wordBank: WordBank;
  tenseFilter: Tense | "mixed";
  onComplete: (results: { correct: number; total: number }) => void;
  onBack: () => void;
}

const TOTAL_SENTENCES = 15;

const TENSE_DISPLAY: Record<Tense, string> = {
  presente: "PRESENTE",
  preterito: "PRETÉRITO",
  imperfecto: "IMPERFECTO",
  futuro: "FUTURO",
};

export default function SentenceBuilder({
  wordBank,
  tenseFilter,
  onComplete,
  onBack,
}: Props) {
  const usedIds = useRef<Set<string>>(new Set());

  const [currentSentence, setCurrentSentence] =
    useState<GeneratedSentence | null>(() =>
      generateSentence(wordBank, tenseFilter, usedIds.current)
    );
  const [scrambled, setScrambled] = useState<string[]>(() =>
    currentSentence ? scrambleWords(currentSentence.words) : []
  );
  const [placed, setPlaced] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);

  const handlePlaceWord = useCallback(
    (scrambledIndex: number) => {
      if (checked) return;
      if (placed.includes(scrambledIndex)) return;
      setPlaced((prev) => [...prev, scrambledIndex]);
    },
    [checked, placed]
  );

  const handleRemoveWord = useCallback(
    (positionIndex: number) => {
      if (checked) return;
      setPlaced((prev) => prev.filter((_, i) => i !== positionIndex));
    },
    [checked]
  );

  const handleCheck = useCallback(() => {
    if (!currentSentence) return;
    const builtWords = placed.map((i) => scrambled[i]);
    const correct =
      builtWords.length === currentSentence.words.length &&
      builtWords.every((w, i) => w === currentSentence.words[i]);
    setIsCorrect(correct);
    setChecked(true);
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [currentSentence, placed, scrambled]);

  const handleNext = useCallback(() => {
    const nextTotal = score.total;
    // score.total was already incremented in handleCheck

    if (nextTotal >= TOTAL_SENTENCES) {
      setDone(true);
      onComplete({ correct: score.correct, total: score.total });
      return;
    }

    const next = generateSentence(wordBank, tenseFilter, usedIds.current);
    if (!next) {
      setDone(true);
      onComplete({ correct: score.correct, total: score.total });
      return;
    }

    setCurrentSentence(next);
    setScrambled(scrambleWords(next.words));
    setPlaced([]);
    setChecked(false);
    setIsCorrect(false);
  }, [score, wordBank, tenseFilter, onComplete]);

  // ─── Done summary ───
  if (done) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-bold">Session Complete</h2>
          <div className="text-6xl font-bold text-blue-400">{pct}%</div>
          <p className="text-slate-300">
            {score.correct} correct out of {score.total} sentences
          </p>
          <div className="flex gap-4 justify-center text-sm">
            <span className="text-green-400 font-semibold">
              {score.correct} correct
            </span>
            <span className="text-red-400 font-semibold">
              {score.total - score.correct} wrong
            </span>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-semibold"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // ─── No sentence available ───
  if (!currentSentence) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-400">
            No sentences could be generated. Check your word bank.
          </p>
          <button
            onClick={onBack}
            className="py-2 px-6 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const allPlaced = placed.length === scrambled.length;

  // Build per-word correctness for feedback
  const wordCorrectness: (boolean | null)[] = placed.map((scrambledIdx, posIdx) => {
    if (!checked) return null;
    return scrambled[scrambledIdx] === currentSentence.words[posIdx];
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            &larr; Back
          </button>
          <span className="text-slate-400 text-sm font-mono">
            {score.total + 1} / {TOTAL_SENTENCES}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((score.total + 1) / TOTAL_SENTENCES) * 100}%`,
            }}
          />
        </div>

        {/* English prompt + tense */}
        <div className="bg-slate-800 rounded-2xl p-6 text-center space-y-2">
          <p className="text-xl text-white font-medium leading-relaxed">
            {currentSentence.english}
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            {TENSE_DISPLAY[currentSentence.tense]}
          </p>
        </div>

        {/* Sentence building area */}
        <div
          className={`min-h-[72px] border-2 border-dashed rounded-xl flex flex-wrap gap-2 p-3 transition-colors ${
            checked
              ? isCorrect
                ? "border-green-500 bg-green-600/10"
                : "border-red-500 bg-red-600/10"
              : "border-slate-600"
          }`}
        >
          {placed.length === 0 && !checked && (
            <span className="text-slate-500 text-sm italic self-center">
              Tap words below to build the sentence...
            </span>
          )}
          {placed.map((scrambledIdx, posIdx) => {
            let btnClass =
              "px-3 py-2 rounded-xl text-white text-sm font-medium transition-colors";
            if (!checked) {
              btnClass += " bg-slate-700 hover:bg-slate-600 cursor-pointer";
            } else if (wordCorrectness[posIdx]) {
              btnClass += " bg-green-600/30 text-green-300";
            } else {
              btnClass += " bg-red-600/30 text-red-300";
            }

            return (
              <button
                key={`placed-${posIdx}-${scrambledIdx}`}
                onClick={() => handleRemoveWord(posIdx)}
                className={btnClass}
                disabled={checked}
              >
                {scrambled[scrambledIdx]}
              </button>
            );
          })}
        </div>

        {/* Feedback after checking */}
        {checked && (
          <div className="text-center space-y-1">
            {isCorrect ? (
              <p className="text-green-400 font-semibold text-lg">Correct!</p>
            ) : (
              <>
                <p className="text-red-400 font-semibold text-lg">Not quite</p>
                <p className="text-slate-400 text-sm">Correct answer:</p>
                <p className="text-green-400 font-medium">
                  {currentSentence.words.join(" ")}
                </p>
              </>
            )}
          </div>
        )}

        {/* Word bank */}
        <div className="flex flex-wrap gap-2 justify-center">
          {scrambled.map((word, idx) => {
            const isUsed = placed.includes(idx);
            return (
              <button
                key={`bank-${idx}`}
                onClick={() => handlePlaceWord(idx)}
                disabled={isUsed || checked}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isUsed
                    ? "bg-slate-800 text-slate-600 cursor-default"
                    : "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {!checked && allPlaced && (
            <button
              onClick={handleCheck}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-semibold"
            >
              Check
            </button>
          )}
          {checked && (
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-semibold"
            >
              {score.total >= TOTAL_SENTENCES ? "See Results" : "Next \u2192"}
            </button>
          )}
        </div>

        {/* Score tracker */}
        <div className="flex justify-center gap-6 text-sm text-slate-400">
          <span>
            <span className="text-green-400 font-semibold">{score.correct}</span>{" "}
            correct
          </span>
          <span>
            <span className="text-red-400 font-semibold">
              {score.total - score.correct}
            </span>{" "}
            wrong
          </span>
        </div>
      </div>
    </div>
  );
}
