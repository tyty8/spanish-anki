"use client";

import { useState, useRef, useEffect } from "react";
import {
  compareAnswers,
  generateDiff,
  autoRate,
  type MatchResult,
  type DiffSegment,
} from "@/lib/matching";

interface Props {
  expected: string;
  onSubmit: (typed: string, result: MatchResult, rating: 0 | 1 | 2 | 3) => void;
}

export default function TypingInput({ expected, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [diff, setDiff] = useState<DiffSegment[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue("");
    setSubmitted(false);
    setResult(null);
    setDiff([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [expected]);

  const handleSubmit = () => {
    if (!value.trim() || submitted) return;
    const matchResult = compareAnswers(value, expected);
    const diffResult = generateDiff(value, expected);
    const rating = autoRate(matchResult.similarity);
    setResult(matchResult);
    setDiff(diffResult);
    setSubmitted(true);
    onSubmit(value, matchResult, rating);
  };

  if (submitted && result) {
    return (
      <div className="space-y-3">
        {/* Diff display */}
        <div className="bg-slate-700 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            Your answer
          </div>
          <div className="flex flex-wrap gap-1 text-lg">
            {diff.map((seg, i) => (
              <span
                key={i}
                className={
                  seg.type === "correct"
                    ? "text-green-400"
                    : seg.type === "wrong"
                    ? "text-red-400 line-through"
                    : seg.type === "missing"
                    ? "text-yellow-400 underline"
                    : "text-red-400 opacity-60"
                }
              >
                {seg.text}
              </span>
            ))}
          </div>
        </div>

        {/* Correct answer */}
        <div className="bg-slate-700 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            Correct
          </div>
          <div className="text-lg text-green-400 font-medium">{expected}</div>
        </div>

        {/* Score */}
        <div className="text-center">
          <span
            className={`text-sm font-bold px-3 py-1 rounded-full ${
              result.similarity >= 0.95
                ? "bg-green-600/30 text-green-400"
                : result.similarity >= 0.85
                ? "bg-blue-600/30 text-blue-400"
                : result.similarity >= 0.6
                ? "bg-orange-600/30 text-orange-400"
                : "bg-red-600/30 text-red-400"
            }`}
          >
            {Math.round(result.similarity * 100)}% match
            {result.accentOnly ? " (accents only)" : ""}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Type your answer..."
        autoComplete="off"
        autoCapitalize="off"
        style={{ userSelect: "text" }}
        className="w-full bg-slate-700 text-white text-xl px-4 py-4 rounded-xl border-2 border-slate-600 focus:border-blue-500 focus:outline-none placeholder:text-slate-500"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold active:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        Check
      </button>
    </div>
  );
}
