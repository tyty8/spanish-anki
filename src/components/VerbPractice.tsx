"use client";

import { useState, useMemo, useCallback } from "react";
import type { Rating } from "@/lib/srs";
import {
  type Verb,
  type Tense,
  type Person,
  conjugate,
  getEnglishPrompt,
  generateDistractors,
  stableVerbId,
  ALL_TENSES,
  ALL_PERSONS,
  TENSE_LABELS,
  PERSON_ES_LABELS,
} from "@/lib/conjugation";

interface Props {
  verbs: Verb[];
  tenseFilter: Tense | "mixed";
  onComplete: (results: { correct: number; total: number }) => void;
  onBack: () => void;
  onReview: (cardId: string, rating: Rating) => void;
}

const TOTAL_QUESTIONS = 20;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Question {
  verb: Verb;
  tense: Tense;
  person: Person;
  correctAnswer: string;
  englishPrompt: string;
  cardId: string;
}

function generateQuestion(
  verbs: Verb[],
  tenseFilter: Tense | "mixed",
  usedIds: Set<string>
): Question | null {
  const tenses = tenseFilter === "mixed" ? ALL_TENSES : [tenseFilter];

  // Build all possible combos, then shuffle to pick one not yet used
  const combos: { verb: Verb; tense: Tense; person: Person }[] = [];
  for (const verb of verbs) {
    for (const tense of tenses) {
      for (const person of ALL_PERSONS) {
        const id = stableVerbId(verb.inf, tense, person);
        if (!usedIds.has(id)) {
          combos.push({ verb, tense, person });
        }
      }
    }
  }

  if (combos.length === 0) return null;

  const pick = combos[Math.floor(Math.random() * combos.length)];
  const cardId = stableVerbId(pick.verb.inf, pick.tense, pick.person);

  return {
    verb: pick.verb,
    tense: pick.tense,
    person: pick.person,
    correctAnswer: conjugate(pick.verb, pick.tense, pick.person),
    englishPrompt: getEnglishPrompt(pick.verb, pick.tense, pick.person),
    cardId,
  };
}

export default function VerbPractice({
  verbs,
  tenseFilter,
  onComplete,
  onBack,
  onReview,
}: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [usedIds] = useState<Set<string>>(() => new Set());
  const [finished, setFinished] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
    () => {
      const q = generateQuestion(verbs, tenseFilter, usedIds);
      if (q) usedIds.add(q.cardId);
      return q;
    }
  );

  const options = useMemo(() => {
    if (!currentQuestion) return [];
    const distractors = generateDistractors(
      currentQuestion.verb,
      currentQuestion.tense,
      currentQuestion.person,
      verbs
    );
    return shuffleArray([currentQuestion.correctAnswer, ...distractors]);
  }, [currentQuestion, verbs]);

  const handleChoose = useCallback(
    (option: string) => {
      if (chosen !== null || !currentQuestion) return;
      setChosen(option);

      const isCorrect = option === currentQuestion.correctAnswer;
      const rating: Rating = isCorrect ? 2 : 0;

      if (isCorrect) {
        setCorrect((c) => c + 1);
      } else {
        setWrong((w) => w + 1);
      }

      onReview(currentQuestion.cardId, rating);
    },
    [chosen, currentQuestion, onReview]
  );

  const handleNext = useCallback(() => {
    const nextIndex = questionIndex + 1;

    if (nextIndex >= TOTAL_QUESTIONS) {
      setFinished(true);
      const finalCorrect = correct + (chosen === currentQuestion?.correctAnswer ? 0 : 0);
      onComplete({ correct, total: TOTAL_QUESTIONS });
      return;
    }

    const q = generateQuestion(verbs, tenseFilter, usedIds);
    if (!q) {
      // Ran out of unique combos
      setFinished(true);
      onComplete({ correct, total: questionIndex + 1 });
      return;
    }

    usedIds.add(q.cardId);
    setCurrentQuestion(q);
    setQuestionIndex(nextIndex);
    setChosen(null);
  }, [questionIndex, verbs, tenseFilter, usedIds, correct, chosen, currentQuestion, onComplete]);

  // ─── Finished summary screen ───
  if (finished) {
    const total = questionIndex + 1;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-bold">Session Complete</h2>
          <div className="text-6xl font-bold text-blue-400">{pct}%</div>
          <p className="text-slate-300">
            {correct} correct out of {total} questions
          </p>
          <div className="flex gap-4 justify-center text-sm">
            <span className="text-green-400 font-semibold">
              {correct} correct
            </span>
            <span className="text-red-400 font-semibold">
              {total - correct} wrong
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

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-400">No verb combinations available.</p>
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
            {questionIndex + 1} / {TOTAL_QUESTIONS}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((questionIndex + 1) / TOTAL_QUESTIONS) * 100}%`,
            }}
          />
        </div>

        {/* Tense + Person label */}
        <div className="bg-slate-800 rounded-xl p-6 text-center space-y-2">
          <div className="text-blue-400 font-semibold text-lg">
            {TENSE_LABELS[currentQuestion.tense]} &mdash;{" "}
            {PERSON_ES_LABELS[currentQuestion.person]}
          </div>
          <div className="text-slate-300 text-base">
            {currentQuestion.englishPrompt}
          </div>
          <div className="text-slate-500 text-sm italic">
            ({currentQuestion.verb.inf})
          </div>
        </div>

        {/* Multiple choice options */}
        <div className="space-y-3">
          {options.map((option, i) => {
            let style =
              "w-full text-left px-4 py-4 rounded-xl border-2 transition-colors text-base leading-relaxed";

            if (chosen === null) {
              style +=
                " bg-slate-700 border-slate-600 text-white active:border-blue-500";
            } else if (option === currentQuestion.correctAnswer) {
              style += " bg-green-600/20 border-green-500 text-green-400";
            } else if (option === chosen) {
              style += " bg-red-600/20 border-red-500 text-red-400";
            } else {
              style += " bg-slate-700/50 border-slate-700 text-slate-500";
            }

            return (
              <button
                key={i}
                onClick={() => handleChoose(option)}
                className={style}
              >
                <span className="font-bold text-slate-400 mr-3">
                  {String.fromCharCode(65 + i)}.
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {/* Feedback + Next button */}
        {chosen !== null && (
          <div className="space-y-3">
            {chosen !== currentQuestion.correctAnswer && (
              <div className="bg-slate-700 rounded-xl p-3 text-center text-sm">
                <span className="text-slate-400">Correct: </span>
                <span className="text-green-400 font-bold">
                  {currentQuestion.correctAnswer}
                </span>
              </div>
            )}
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-semibold"
            >
              {questionIndex + 1 >= TOTAL_QUESTIONS ? "See Results" : "Next"}
            </button>
          </div>
        )}

        {/* Score tracker */}
        <div className="flex justify-center gap-6 text-sm text-slate-400">
          <span>
            <span className="text-green-400 font-semibold">{correct}</span>{" "}
            correct
          </span>
          <span>
            <span className="text-red-400 font-semibold">{wrong}</span> wrong
          </span>
        </div>
      </div>
    </div>
  );
}
