/**
 * Comprehensive Arabic text normalization for Quran recitation matching.
 * Removes all diacritics, waqf marks, and normalizes letter forms.
 */
export function normalizeArabic(text: string): string {
  return text
    // Remove all Arabic diacritics and Quran-specific marks
    .replace(/[\u0610-\u061A]/g, "") // Quranic annotation signs
    .replace(/[\u064B-\u065F]/g, "") // Standard tashkeel (fathah, dammah, kasrah, shadda, sukun, etc.)
    .replace(/\u0670/g, "")          // Superscript alef
    .replace(/[\u06D6-\u06ED]/g, "") // Quranic marks (waqf, sajda, etc.)
    .replace(/\u0640/g, "")          // Tatweel (kashida)
    // Normalize letter forms
    .replace(/[ٱأإآ]/g, "ا")        // All alef variants → plain alef
    .replace(/ة/g, "ه")             // Taa marbutah → haa
    .replace(/ى/g, "ي")             // Alef maqsura → yaa
    .replace(/ؤ/g, "و")             // Waw with hamza → waw
    .replace(/ئ/g, "ي")             // Yaa with hamza → yaa
    .replace(/ء/g, "")              // Standalone hamza remove
    // Clean punctuation and extra spaces
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

/**
 * Check if two Arabic words match after normalization.
 * Uses fuzzy prefix matching as fallback for partial speech recognition.
 */
export function isArabicWordMatch(expected: string, spoken: string): boolean {
  const normExpected = normalizeArabic(expected);
  const normSpoken = normalizeArabic(spoken);
  
  if (!normExpected || !normSpoken) return false;
  
  // Exact match
  if (normExpected === normSpoken) return true;
  
  // Fuzzy: spoken is prefix of expected (≥60% length) or vice versa
  const minLen = Math.min(normExpected.length, normSpoken.length);
  const maxLen = Math.max(normExpected.length, normSpoken.length);
  if (minLen >= 2 && minLen / maxLen >= 0.6) {
    if (normExpected.startsWith(normSpoken) || normSpoken.startsWith(normExpected)) {
      return true;
    }
  }
  
  return false;
}
