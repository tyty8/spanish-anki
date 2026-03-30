"use client";

import { useState, useRef, useEffect } from "react";
import { compareAnswers, autoRate, type MatchResult } from "@/lib/matching";

interface Props {
  front: string;
  expected: string;
  onSubmit: (typed: string, result: MatchResult, rating: 0 | 1 | 2 | 3) => void;
}

export default function FillInBlank({ front, expected, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue("");
    setSubmitted(false);
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [front, expected]);

  const handleSubmit = () => {
    if (!value.trim() || submitted) return;
    const matchResult = compareAnswers(value, expected);
    const rating = autoRate(matchResult.similarity);
    setResult(matchResult);
    setSubmitted(true);
    onSubmit(value, matchResult, rating);
  };

  const parts = front.split("___");

  return (
    <div className="space-y-4">
      {/* Sentence with blank */}
      <div className="text-xl leading-relaxed text-center">
        {parts.map((part, i) => (
          <span key={i}>
            <span className="text-white">{part}</span>
            {i < parts.length - 1 && (
              submitted ? (
                <span
                  className={`font-bold px-1 ${
                    result && result.isCorrect
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {result && result.isCorrect ? value : expected}
                </span>
              ) : (
                <input
                  ref={i === 0 ? inputRef : undefined}
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoComplete="off"
                  autoCapitalize="off"
                  style={{ userSelect: "text" }}
                  className="inline-block w-32 bg-transparent text-blue-400 text-xl text-center border-b-2 border-blue-500 focus:border-blue-400 focus:outline-none mx-1 pb-1"
                />
              )
            )}
          </span>
        ))}
      </div>

      {submitted && result ? (
        <div className="space-y-2">
          {!result.isCorrect && (
            <div className="bg-slate-700 rounded-xl p-3 text-center">
              <span className="text-sm text-slate-400">You wrote: </span>
              <span className="text-red-400 line-through">{value}</span>
              <span className="text-sm text-slate-400"> → </span>
              <span className="text-green-400 font-bold">{expected}</span>
            </div>
          )}
          <div className="text-center">
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full ${
                result.isCorrect
                  ? "bg-green-600/30 text-green-400"
                  : "bg-red-600/30 text-red-400"
              }`}
            >
              {result.isCorrect ? "Correct!" : "Incorrect"}
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold active:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Check
        </button>
      )}
    </div>
  );
}
