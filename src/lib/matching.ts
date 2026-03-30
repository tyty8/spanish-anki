// Answer comparison engine for typing mode

export interface MatchResult {
  similarity: number; // 0-1
  isCorrect: boolean;
  typed: string;
  expected: string;
  accentOnly: boolean; // true if only accent differences
}

export interface DiffSegment {
  text: string;
  type: "correct" | "wrong" | "missing" | "extra";
}

export function normalizeText(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export function removeAccents(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, "n");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function compareAnswers(typed: string, expected: string): MatchResult {
  const normTyped = normalizeText(typed);
  const normExpected = normalizeText(expected);

  if (normTyped === normExpected) {
    return { similarity: 1, isCorrect: true, typed, expected, accentOnly: false };
  }

  // Check if only accents differ
  const noAccTyped = removeAccents(normTyped);
  const noAccExpected = removeAccents(normExpected);
  const accentOnly = noAccTyped === noAccExpected;

  const dist = levenshtein(normTyped, normExpected);
  const maxLen = Math.max(normTyped.length, normExpected.length, 1);
  const similarity = 1 - dist / maxLen;

  return {
    similarity: accentOnly ? Math.max(similarity, 0.9) : similarity,
    isCorrect: similarity >= 0.85 || accentOnly,
    typed,
    expected,
    accentOnly,
  };
}

export function generateDiff(typed: string, expected: string): DiffSegment[] {
  const typedWords = normalizeText(typed).split(" ");
  const expectedWords = normalizeText(expected).split(" ");
  const segments: DiffSegment[] = [];
  const maxLen = Math.max(typedWords.length, expectedWords.length);

  for (let i = 0; i < maxLen; i++) {
    const tw = typedWords[i];
    const ew = expectedWords[i];

    if (!tw && ew) {
      segments.push({ text: ew, type: "missing" });
    } else if (tw && !ew) {
      segments.push({ text: tw, type: "extra" });
    } else if (tw === ew) {
      segments.push({ text: tw, type: "correct" });
    } else if (removeAccents(tw) === removeAccents(ew)) {
      // Only accent difference
      segments.push({ text: tw, type: "wrong" });
    } else {
      segments.push({ text: tw, type: "wrong" });
    }
  }

  return segments;
}

export function classifyErrors(
  typed: string,
  expected: string,
  tags: string[]
): string[] {
  const errors: string[] = [];
  const normTyped = normalizeText(typed);
  const normExpected = normalizeText(expected);

  if (normTyped === normExpected) return errors;

  // Accent-only errors
  if (removeAccents(normTyped) === removeAccents(normExpected)) {
    errors.push("accent-missing");
    return errors;
  }

  // Gender errors (el/la, -o/-a swaps)
  const genderSwaps = [
    [/\bel\b/, /\bla\b/],
    [/\bla\b/, /\bel\b/],
    [/\blos\b/, /\blas\b/],
    [/\blas\b/, /\blos\b/],
  ];
  for (const [from, to] of genderSwaps) {
    if (from.test(normTyped) && to.test(normExpected)) {
      errors.push("gender-error");
      break;
    }
  }

  // Tag-specific confusions
  if (tags.includes("era-vs-estaba") || tags.includes("ser-estar")) {
    const hasEra = /\bera\b/.test(normTyped);
    const hasEstaba = /\bestaba\b/.test(normTyped);
    const expectEra = /\bera\b/.test(normExpected);
    const expectEstaba = /\bestaba\b/.test(normExpected);
    if ((hasEra && expectEstaba) || (hasEstaba && expectEra)) {
      errors.push("era-estaba");
    }
  }

  if (tags.includes("por-vs-para")) {
    const hasPor = /\bpor\b/.test(normTyped);
    const hasPara = /\bpara\b/.test(normTyped);
    const expectPor = /\bpor\b/.test(normExpected);
    const expectPara = /\bpara\b/.test(normExpected);
    if ((hasPor && expectPara) || (hasPara && expectPor)) {
      errors.push("por-para");
    }
  }

  // General spelling if no other category
  if (errors.length === 0) {
    errors.push("spelling");
  }

  return errors;
}

export function autoRate(similarity: number): 0 | 1 | 2 | 3 {
  if (similarity >= 0.95) return 3; // Easy
  if (similarity >= 0.85) return 2; // Good
  if (similarity >= 0.6) return 1; // Hard
  return 0; // Again
}

export function extractBlankAnswer(front: string, back: string): string {
  // For cards like "___ reunión" with back "LA reunión (-ción = always feminine)"
  // Extract the word(s) that replace ___
  const cleanBack = back.split("(")[0].trim();
  const frontParts = front.split("___").map((s) => s.trim()).filter(Boolean);

  if (frontParts.length === 0) return cleanBack;

  // Remove the parts of front from the back to find the blank answer
  let answer = cleanBack;
  for (const part of frontParts) {
    answer = answer.replace(new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "").trim();
  }

  return answer || cleanBack.split(" ")[0];
}
