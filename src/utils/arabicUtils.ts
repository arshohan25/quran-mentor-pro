/**
 * Advanced Arabic text normalization for Quran recitation matching.
 * Removes all diacritics, waqf marks, and normalizes letter forms.
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u0610-\u061A]/g, "") // Quranic annotation signs
    .replace(/[\u064B-\u065F]/g, "") // Standard tashkeel
    .replace(/\u0670/g, "")          // Superscript alef
    .replace(/[\u06D6-\u06ED]/g, "") // Quranic marks (waqf, sajda)
    .replace(/\u0640/g, "")          // Tatweel
    .replace(/[ٱأإآ]/g, "ا")        // All alef variants → plain alef
    .replace(/ة/g, "ه")             // Taa marbutah → haa
    .replace(/ى/g, "ي")             // Alef maqsura → yaa
    .replace(/ؤ/g, "و")             // Waw with hamza → waw
    .replace(/ئ/g, "ي")             // Yaa with hamza → yaa
    .replace(/ء/g, "")              // Standalone hamza remove
    .replace(/[^\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Split Arabic text into clean word tokens.
 */
export function tokenizeArabicWords(text: string): string[] {
  return text
    .replace(/[^\u0600-\u06FF\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

// Phonetic confusion groups — letters commonly confused by speech recognition
const PHONETIC_GROUPS: string[][] = [
  ["ت", "ط"],        // ta/tta
  ["ث", "س", "ص"],   // tha/sa/sad
  ["د", "ض"],        // dal/dad
  ["ذ", "ز", "ظ"],   // dhal/za/dha
  ["ح", "ه"],        // ha/haa
  ["ع", "ا"],        // ain/alef
  ["غ", "خ"],        // ghain/kha
  ["ق", "ك"],        // qaf/kaf
];

const phoneticMap: Map<string, number> = new Map();
PHONETIC_GROUPS.forEach((group, gi) => {
  group.forEach(ch => phoneticMap.set(ch, gi));
});

function arePhoneticallySimilar(a: string, b: string): boolean {
  if (a === b) return true;
  const ga = phoneticMap.get(a);
  const gb = phoneticMap.get(b);
  return ga !== undefined && ga === gb;
}

/**
 * Compute similarity score between two normalized Arabic strings (0-1).
 * Uses a phonetic-aware edit distance.
 */
export function arabicSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const la = a.length;
  const lb = b.length;
  const maxLen = Math.max(la, lb);
  if (maxLen === 0) return 1;

  // Optimize: if lengths differ too much, quick reject
  if (Math.abs(la - lb) / maxLen > 0.6) return 0;

  // Wagner-Fischer with phonetic substitution cost
  const dp: number[][] = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        const subCost = arePhoneticallySimilar(a[i - 1], b[j - 1]) ? 0.3 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,         // deletion
          dp[i][j - 1] + 1,         // insertion
          dp[i - 1][j - 1] + subCost // substitution
        );
      }
    }
  }

  const distance = dp[la][lb];
  return Math.max(0, 1 - distance / maxLen);
}

export type MatchMode = "strict" | "balanced" | "assist";

/**
 * Get dynamic threshold based on mode and word length.
 */
function getThreshold(mode: MatchMode, wordLength: number): number {
  const base = mode === "strict" ? 0.85 : mode === "balanced" ? 0.55 : 0.4;
  // Short words need higher threshold (fewer chars = less room for error)
  if (wordLength <= 2) return Math.min(base + 0.15, 0.95);
  if (wordLength <= 4) return base + 0.05;
  // Long words can be more lenient
  if (wordLength >= 8) return Math.max(base - 0.1, 0.3);
  return base;
}

/**
 * Check if two Arabic words match after normalization.
 * Returns true if similarity meets dynamic threshold.
 */
export function isArabicWordMatch(
  expected: string,
  spoken: string,
  mode: MatchMode = "balanced"
): boolean {
  const normExpected = normalizeArabic(expected);
  const normSpoken = normalizeArabic(spoken);

  if (!normExpected || !normSpoken) return false;
  if (normExpected === normSpoken) return true;

  // Prefix match (speech recognition often gives partial words)
  const minLen = Math.min(normExpected.length, normSpoken.length);
  const maxLen = Math.max(normExpected.length, normSpoken.length);
  if (minLen >= 2 && minLen / maxLen >= 0.6) {
    if (normExpected.startsWith(normSpoken) || normSpoken.startsWith(normExpected)) {
      return true;
    }
  }

  // Edit-distance similarity with phonetic awareness
  const score = arabicSimilarity(normExpected, normSpoken);
  const threshold = getThreshold(mode, normExpected.length);
  return score >= threshold;
}

/**
 * Score a spoken word against expected, returning best score from multiple alternatives.
 */
export function bestMatchScore(
  expected: string,
  alternatives: string[],
  mode: MatchMode = "balanced"
): { matched: boolean; bestScore: number } {
  const normExpected = normalizeArabic(expected);
  if (!normExpected) return { matched: false, bestScore: 0 };

  let bestScore = 0;

  for (const alt of alternatives) {
    const tokens = tokenizeArabicWords(alt);
    for (const token of tokens) {
      const normToken = normalizeArabic(token);
      if (!normToken) continue;

      if (normExpected === normToken) return { matched: true, bestScore: 1 };

      // Prefix check
      const minLen = Math.min(normExpected.length, normToken.length);
      const maxLen = Math.max(normExpected.length, normToken.length);
      if (minLen >= 2 && minLen / maxLen >= 0.6) {
        if (normExpected.startsWith(normToken) || normToken.startsWith(normExpected)) {
          return { matched: true, bestScore: 0.95 };
        }
      }

      const score = arabicSimilarity(normExpected, normToken);
      if (score > bestScore) bestScore = score;
    }
  }

  const threshold = getThreshold(mode, normExpected.length);
  return { matched: bestScore >= threshold, bestScore };
}
