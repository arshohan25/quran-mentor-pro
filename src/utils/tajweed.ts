// Tajweed color coding for Arabic Quran text
// Regex-based approximate matching for major tajweed rules

const SUKUN = "\u0652";
const SHADDA = "\u0651";
const FATHATAN = "\u064B";
const DAMMATAN = "\u064C";
const KASRATAN = "\u064D";
const TANWIN = `[${FATHATAN}${DAMMATAN}${KASRATAN}]`;
const NOON = "\u0646";
const MEEM = "\u0645";
const MADD_SIGN = "\u0653"; // maddah above

// Idgham letters: ي ن م و ل ر
const IDGHAM_LETTERS = "ينمولر";
// Ikhfa letters: ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك
const IKHFA_LETTERS = "تثجدذزسشصضطظفقك";
// Qalqalah letters: ق ط ب ج د
const QALQALAH_LETTERS = "قطبجد";

// Diacritics pattern (harakat)
const HARAKA = "[\u064B-\u0652\u0670\u06D6-\u06ED]";

interface TajweedRule {
  name: string;
  nameBn: string;
  color: string;
  pattern: RegExp;
}

const rules: TajweedRule[] = [
  // Iqlab: noon sakin/tanwin before ب → becomes meem sound
  {
    name: "Iqlab",
    nameBn: "ইকলাব",
    color: "#22C55E",
    pattern: new RegExp(`(${NOON}${SUKUN}|${TANWIN})(${HARAKA}*)(ب)`, "g"),
  },
  // Idgham: noon sakin/tanwin before ي ن م و ل ر
  {
    name: "Idgham",
    nameBn: "ইদগাম",
    color: "#0EA5E9",
    pattern: new RegExp(`(${NOON}${SUKUN}|${TANWIN})(\\s*)(${HARAKA}*[${IDGHAM_LETTERS}])`, "g"),
  },
  // Ikhfa: noon sakin/tanwin before ikhfa letters
  {
    name: "Ikhfa",
    nameBn: "ইখফা",
    color: "#D946EF",
    pattern: new RegExp(`(${NOON}${SUKUN}|${TANWIN})(\\s*)(${HARAKA}*[${IKHFA_LETTERS}])`, "g"),
  },
  // Ghunnah: noon or meem with shadda
  {
    name: "Ghunnah",
    nameBn: "গুন্নাহ",
    color: "#FF7F27",
    pattern: new RegExp(`([${NOON}${MEEM}]${SHADDA})`, "g"),
  },
  // Qalqalah: ق ط ب ج د with sukun
  {
    name: "Qalqalah",
    nameBn: "কলকলা",
    color: "#EF4444",
    pattern: new RegExp(`([${QALQALAH_LETTERS}]${SUKUN})`, "g"),
  },
  // Madd: maddah sign or long vowel indicators
  {
    name: "Madd",
    nameBn: "মদ্দ",
    color: "#3B82F6",
    pattern: new RegExp(`(${MADD_SIGN}|ٰ)`, "g"),
  },
];

export function applyTajweedColors(text: string): string {
  let result = text;
  const applied = new Set<number>();

  for (const rule of rules) {
    result = result.replace(rule.pattern, (match) => {
      return `<span style="color:${rule.color}" title="${rule.nameBn}">${match}</span>`;
    });
  }

  return result;
}

export const tajweedLegend = rules.map((r) => ({
  name: r.name,
  nameBn: r.nameBn,
  color: r.color,
}));
