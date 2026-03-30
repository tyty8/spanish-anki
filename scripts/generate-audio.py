"""Generate MP3 audio for all flashcards using Microsoft Edge TTS (Chilean Spanish voice)."""

import asyncio
import json
import os
import re
import sys

# Add parent dir to path for card data
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
AUDIO_DIR = os.path.join(PROJECT_DIR, "public", "audio")
CARDS_FILE = os.path.join(PROJECT_DIR, "src", "data", "cards.ts")

VOICE = "es-CL-CatalinaNeural"


def stable_id(s: str) -> str:
    """Match the JavaScript stableId hash function."""
    h = 0
    for ch in s:
        h = ((h << 5) - h + ord(ch)) & 0xFFFFFFFF
        # Convert to signed 32-bit
        if h >= 0x80000000:
            h -= 0x100000000
        h = h & 0xFFFFFFFF
    return format(h, "08x")


def parse_cards(filepath: str) -> list[dict]:
    """Parse the raw card tuples from cards.ts."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract the raw array content
    match = re.search(r"const raw:.*?\[\s*\n(.*?)\n\];", content, re.DOTALL)
    if not match:
        print("ERROR: Could not parse cards.ts")
        sys.exit(1)

    raw_content = match.group(1)
    cards = []

    # Match each tuple: ["front", "back", "tags"]
    for m in re.finditer(
        r'\["((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\]',
        raw_content,
    ):
        front = m.group(1).replace('\\"', '"').replace("\\n", "\n")
        back = m.group(2).replace('\\"', '"').replace("\\n", "\n")
        tags = m.group(3)
        card_id = stable_id(front)
        cards.append({"id": card_id, "front": front, "back": back, "tags": tags})

    return cards


def clean_text_for_tts(back: str) -> str:
    """Clean the back text to extract only pronounceable Spanish."""
    text = back

    # Remove parenthetical notes
    text = re.sub(r"\([^)]*\)", "", text)

    # Remove explanatory text after " — " or " = "
    text = re.sub(r"\s*—\s*.*$", "", text)
    text = re.sub(r"\s*=\s*.*$", "", text)

    # Replace " / " with ", " for natural speech
    text = text.replace(" / ", ", ")

    # Remove prefixes like "SER — ", "ESTAR — ", "PARA ", "POR "
    # Only if they're uppercase instruction-style
    text = re.sub(r"^(SER|ESTAR|POR|PARA|IMPERFECTO|ERA|FUE|ESTABA)\b\s*", "", text)

    # Remove tags like "NOT" instructions
    text = re.sub(r"\bNOT\b.*?(?=,|$)", "", text)

    # Remove "ALWAYS", "NEVER" instruction words
    text = re.sub(r"\b(ALWAYS|NEVER|Note:)\b.*$", "", text)

    # Clean up whitespace and trailing punctuation
    text = re.sub(r"\s+", " ", text).strip()
    text = text.rstrip(",. ")

    return text


def should_generate(card: dict) -> bool:
    """Determine if a card should have audio generated."""
    back = card["back"]
    tags = card["tags"]

    # Skip pure English instruction cards
    # Check if back text has Spanish content
    spanish_chars = set("áéíóúñü¿¡")
    has_spanish = any(c in back.lower() for c in spanish_chars)

    # Also check for common Spanish words
    spanish_words = ["es", "el", "la", "los", "las", "un", "una", "yo", "que", "de", "en"]
    words = back.lower().split()
    has_spanish_words = any(w in spanish_words for w in words)

    return has_spanish or has_spanish_words


async def generate_audio(card: dict, index: int, total: int) -> bool:
    """Generate audio for a single card."""
    import edge_tts

    card_id = card["id"]
    output_path = os.path.join(AUDIO_DIR, f"{card_id}.mp3")

    # Skip if already exists
    if os.path.exists(output_path) and os.path.getsize(output_path) > 100:
        return True

    text = clean_text_for_tts(card["back"])
    if not text or len(text) < 2:
        return False

    try:
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(output_path)
        front_safe = card["front"][:50].encode("ascii", "replace").decode()
        print(f"  [{index}/{total}] {front_safe}")
        return True
    except Exception as e:
        front_safe = card["front"][:40].encode("ascii", "replace").decode()
        err_safe = str(e).encode("ascii", "replace").decode()
        print(f"  [{index}/{total}] ERROR: {front_safe} - {err_safe}")
        return False


async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)

    print("Parsing cards...")
    cards = parse_cards(CARDS_FILE)
    print(f"Found {len(cards)} cards")

    # Filter to cards that should have audio
    audio_cards = [c for c in cards if should_generate(c)]
    print(f"Generating audio for {len(audio_cards)} cards...")

    success = 0
    failed = 0

    # Process sequentially to avoid rate limiting
    for i, card in enumerate(audio_cards, 1):
        result = await generate_audio(card, i, len(audio_cards))
        if result:
            success += 1
        else:
            failed += 1

        # Small delay to avoid throttling
        if i % 10 == 0:
            await asyncio.sleep(0.5)

    print(f"\nDone! Generated: {success}, Failed: {failed}, Skipped: {len(cards) - len(audio_cards)}")


if __name__ == "__main__":
    asyncio.run(main())
