// Tajweed color coding for Arabic Quran text
// Regex-based approximate matching for major tajweed rules

const SUKUN = "\u0652";
const SHADDA = "\u0651";
const FATHA = "\u064E";
const DAMMA = "\u064F";
const KASRA = "\u0650";
const FATHATAN = "\u064B";
const DAMMATAN = "\u064C";
const KASRATAN = "\u064D";
const TANWIN = `[${FATHATAN}${DAMMATAN}${KASRATAN}]`;
const NOON = "\u0646";
const MEEM = "\u0645";
const ALIF = "\u0627";
const WAW = "\u0648";
const YA = "\u064A";
const MADD_SIGN = "\u0653"; // maddah above
const SUPERSCRIPT_ALIF = "\u0670"; // small alif above

// Letter groups
const IDGHAM_WITH_GHUNNAH = "ينمو";
const IDGHAM_WITHOUT_GHUNNAH = "لر";
const IDGHAM_LETTERS = IDGHAM_WITH_GHUNNAH + IDGHAM_WITHOUT_GHUNNAH;
const IKHFA_LETTERS = "تثجدذزسشصضطظفقك";
const IZHAR_LETTERS = "ءهعحغخ"; // throat letters for izhar
const QALQALAH_LETTERS = "قطبجد";
const IDGHAM_SHAFAWI_LETTER = MEEM; // meem sakin before meem

// Diacritics pattern (harakat)
const HARAKA = "[\u064B-\u0652\u0670\u06D6-\u06ED]";
const OPTIONAL_HARAKA = `${HARAKA}*`;

interface TajweedRule {
  name: string;
  nameBn: string;
  nameEn: string;
  color: string;
  pattern: RegExp;
}

const rules: TajweedRule[] = [
  // === Noon Sakin / Tanwin Rules ===

  // Izhar: noon sakin/tanwin before throat letters (ء ه ع ح غ خ) — clear pronunciation
  {
    name: "Izhar",
    nameBn: "ইজহার",
    nameEn: "Clear",
    color: "#F97316", // orange-500
    pattern: new RegExp(`(${NOON}${SUKUN}|${TANWIN})(\\s*${OPTIONAL_HARAKA}[${IZHAR_LETTERS}])`, "g"),
  },
  // Iqlab: noon sakin/tanwin before ب → becomes meem sound
  {
    name: "Iqlab",
    nameBn: "ইকলাব",
    nameEn: "Change",
    color: "#22C55E",
    pattern: new RegExp(`(${NOON}${SUKUN}|${TANWIN})(${OPTIONAL_HARAKA})(ب)`, "g"),
  },
  // Idgham with Ghunnah: noon sakin/tanwin before ي ن م و
  {
    name: "Idgham Ghunnah",
    nameBn: "ইদগাম (গুন্নাহ)",
    nameEn: "Merge+Nasal",
    color: "#0EA5E9",
    pattern: new RegExp(`(${NOON}${SUKUN}|${TANWIN})(\\s+)(${OPTIONAL_HARAKA}[${IDGHAM_WITH_GHUNNAH}])`, "g"),
  },
  // Idgham without Ghunnah: noon sakin/tanwin before ل ر
  {
    name: "Idgham No Ghunnah",
    nameBn: "ইদগাম (গুন্নাহ ছাড়া)",
    nameEn: "Merge",
    color: "#06B6D4", // cyan-500
    pattern: new RegExp(`(${NOON}${SUKUN}|${TANWIN})(\\s+)(${OPTIONAL_HARAKA}[${IDGHAM_WITHOUT_GHUNNAH}])`, "g"),
  },
  // Ikhfa: noon sakin/tanwin before ikhfa letters — hidden/nasalized
  {
    name: "Ikhfa",
    nameBn: "ইখফা",
    nameEn: "Hidden",
    color: "#D946EF",
    pattern: new RegExp(`(${NOON}${SUKUN}|${TANWIN})(\\s*)(${OPTIONAL_HARAKA}[${IKHFA_LETTERS}])`, "g"),
  },

  // === Meem Sakin Rules ===

  // Ikhfa Shafawi: meem sakin before ب
  {
    name: "Ikhfa Shafawi",
    nameBn: "ইখফা শাফাবী",
    nameEn: "Lip Hidden",
    color: "#A855F7", // purple-500
    pattern: new RegExp(`(${MEEM}${SUKUN})(\\s*${OPTIONAL_HARAKA}ب)`, "g"),
  },
  // Idgham Shafawi: meem sakin before meem
  {
    name: "Idgham Shafawi",
    nameBn: "ইদগাম শাফাবী",
    nameEn: "Lip Merge",
    color: "#8B5CF6", // violet-500
    pattern: new RegExp(`(${MEEM}${SUKUN})(\\s*${OPTIONAL_HARAKA}${MEEM})`, "g"),
  },

  // === General Rules ===

  // Ghunnah: noon or meem with shadda — 2-count nasalization
  {
    name: "Ghunnah",
    nameBn: "গুন্নাহ",
    nameEn: "Nasal",
    color: "#FF7F27",
    pattern: new RegExp(`([${NOON}${MEEM}]${SHADDA})`, "g"),
  },
  // Qalqalah: ق ط ب ج د with sukun — echoing bounce
  {
    name: "Qalqalah",
    nameBn: "কলকলা",
    nameEn: "Echo",
    color: "#EF4444",
    pattern: new RegExp(`([${QALQALAH_LETTERS}]${SUKUN})`, "g"),
  },

  // === Madd (Prolongation) Rules ===

  // Madd Lazim: maddah sign (ٓ) — obligatory 6-count prolongation
  {
    name: "Madd Lazim",
    nameBn: "মদ্দে লাযিম",
    nameEn: "Obligatory",
    color: "#1D4ED8", // blue-700 (darker blue)
    pattern: new RegExp(`(\\S${MADD_SIGN})`, "g"),
  },
  // Madd Aridi: natural madd letter before end-of-ayah sukun (approximation: alif/waw/ya near end)
  // We detect fatha+alif, damma+waw-sukun, kasra+ya-sukun patterns
  {
    name: "Madd Tabii",
    nameBn: "মদ্দে তাবিঈ",
    nameEn: "Natural",
    color: "#3B82F6", // blue-500
    pattern: new RegExp(`(${FATHA}${ALIF}|${DAMMA}${WAW}${SUKUN}|${KASRA}${YA}${SUKUN}|${SUPERSCRIPT_ALIF}|ٰ)`, "g"),
  },
  // Madd Iwad: fathatan at end of word (stopped with alif sound)
  {
    name: "Madd Iwad",
    nameBn: "মদ্দে ইওয়ায",
    nameEn: "Substitute",
    color: "#60A5FA", // blue-400
    pattern: new RegExp(`(${FATHATAN})(\\s|$)`, "g"),
  },
];

export function applyTajweedColors(text: string): string {
  // Use a marker-based approach to avoid nested spans
  interface Marker { start: number; end: number; color: string; title: string; }
  const markers: Marker[] = [];

  for (const rule of rules) {
    let match: RegExpExecArray | null;
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      // Check no overlap with existing markers
      const overlaps = markers.some(m => start < m.end && end > m.start);
      if (!overlaps) {
        markers.push({ start, end, color: rule.color, title: rule.nameBn });
      }
    }
  }

  if (markers.length === 0) return escapeHtml(text);

  // Sort by position
  markers.sort((a, b) => a.start - b.start);

  let result = "";
  let lastIdx = 0;
  for (const m of markers) {
    result += escapeHtml(text.slice(lastIdx, m.start));
    result += `<span style="color:${m.color}" title="${m.title}">${escapeHtml(text.slice(m.start, m.end))}</span>`;
    lastIdx = m.end;
  }
  result += escapeHtml(text.slice(lastIdx));

  return result;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const tajweedLegend = rules.map((r) => ({
  name: r.name,
  nameBn: r.nameBn,
  nameEn: r.nameEn,
  color: r.color,
}));
