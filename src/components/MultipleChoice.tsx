"use client";

import { useState, useEffect, useMemo } from "react";
import type { Rating } from "@/lib/srs";

interface Props {
  correctAnswer: string;
  distractors: string[];
  onSubmit: (chosen: string, isCorrect: boolean, rating: Rating) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shorten answer for display: take text before first parenthetical
function displayText(s: string): string {
  const clean = s.split("(")[0].trim();
  return clean || s;
}

export default function MultipleChoice({
  correctAnswer,
  distractors,
  onSubmit,
}: Props) {
  const [chosen, setChosen] = useState<string | null>(null);

  const options = useMemo(
    () => shuffleArray([correctAnswer, ...distractors.slice(0, 3)]),
    [correctAnswer, distractors]
  );

  useEffect(() => {
    setChosen(null);
  }, [correctAnswer]);

  const handleChoose = (option: string) => {
    if (chosen !== null) return;
    setChosen(option);
    const isCorrect = option === correctAnswer;
    const rating: Rating = isCorrect ? 2 : 0;
    onSubmit(option, isCorrect, rating);
  };

  return (
    <div className="space-y-3">
      {options.map((option, i) => {
        let style =
          "w-full text-left px-4 py-4 rounded-xl border-2 transition-colors text-base leading-relaxed";

        if (chosen === null) {
          style +=
            " bg-slate-700 border-slate-600 text-white active:border-blue-500";
        } else if (option === correctAnswer) {
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
            {displayText(option)}
          </button>
        );
      })}

      {chosen !== null && chosen !== correctAnswer && (
        <div className="bg-slate-700 rounded-xl p-3 text-center text-sm">
          <span className="text-slate-400">Correct: </span>
          <span className="text-green-400 font-bold">
            {displayText(correctAnswer)}
          </span>
        </div>
      )}
    </div>
  );
}
