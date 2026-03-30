"use client";

import { useState, useEffect } from "react";
import { hasAudio, playCardAudio, playWithSpeed } from "@/lib/audio";

interface Props {
  cardId: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-sm px-2 py-1",
  md: "text-lg px-3 py-2",
  lg: "text-2xl px-4 py-3",
};

export default function AudioButton({ cardId, size = "md" }: Props) {
  const [available, setAvailable] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    hasAudio(cardId).then(setAvailable);
  }, [cardId]);

  if (!available) return null;

  const handleClick = async () => {
    if (playing) return;
    setPlaying(true);

    // Second tap = slow mode
    const newCount = tapCount + 1;
    setTapCount(newCount);

    try {
      if (newCount % 2 === 0) {
        await playWithSpeed(cardId, 0.7);
      } else {
        await playCardAudio(cardId);
      }
    } finally {
      setTimeout(() => setPlaying(false), 500);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} rounded-xl bg-slate-700 active:bg-slate-600 transition-colors ${
        playing ? "animate-pulse" : ""
      }`}
      title={tapCount % 2 === 0 ? "Play (tap again for slow)" : "Playing slow"}
    >
      {playing ? "🔊" : "🔈"}
    </button>
  );
}
