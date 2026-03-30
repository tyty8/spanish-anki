// Audio playback utilities for TTS-generated card audio

const audioCache = new Map<string, boolean>();

export async function hasAudio(cardId: string): Promise<boolean> {
  if (audioCache.has(cardId)) return audioCache.get(cardId)!;

  try {
    const res = await fetch(`/audio/${cardId}.mp3`, { method: "HEAD" });
    const exists = res.ok;
    audioCache.set(cardId, exists);
    return exists;
  } catch {
    audioCache.set(cardId, false);
    return false;
  }
}

export async function playCardAudio(cardId: string): Promise<void> {
  return playWithSpeed(cardId, 1.0);
}

export async function playWithSpeed(
  cardId: string,
  rate: number
): Promise<void> {
  try {
    const audio = new Audio(`/audio/${cardId}.mp3`);
    audio.playbackRate = rate;
    await audio.play();
  } catch {
    // Silently fail if audio not available
  }
}
