import { useQuery } from "@tanstack/react-query";
import { HADITH_CHAPTER_NAMES_BN } from "@/data/hadithChapterNamesBn";

// Free, no-key Bengali hadith API by fawazahmed0 (CDN-hosted JSON)
// https://github.com/fawazahmed0/hadith-api
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

interface RawHadith {
  hadithnumber: number;
  arabicnumber: number;
  text: string;
  grades?: { name: string; grade: string }[];
  reference?: { book: number; hadith: number };
}

interface RawEdition {
  metadata: {
    name: string;
    sections: Record<string, string>;
    section_details: Record<string, {
      hadithnumber_first: number;
      hadithnumber_last: number;
      arabicnumber_first: number;
      arabicnumber_last: number;
    }>;
  };
  hadiths: RawHadith[];
}

// Public unified shapes (kept compatible with existing components)
export interface ApiHadith {
  id: number;
  hadithNumber: string;
  englishNarrator?: string;
  hadithEnglish?: string;
  hadithArabic?: string;
  hadithBengali?: string;
  status?: string;
  chapterId?: string;
  bookSlug?: string;
}

export interface ApiChapter {
  id: number;
  chapterNumber: string;
  chapterEnglish: string;
  chapterBengali?: string;
  chapterArabic?: string;
  hadithCount: number;
}

async function fetchEdition(prefix: "ben" | "ara" | "eng", book: string): Promise<RawEdition> {
  const res = await fetch(`${CDN}/${prefix}-${book}.min.json`);
  if (!res.ok) throw new Error(`Failed to load ${prefix}-${book}`);
  return res.json();
}

const editionStaleTime = 1000 * 60 * 60 * 24; // 24h

function useEdition(prefix: "ben" | "ara" | "eng", book: string, enabled = true) {
  return useQuery({
    queryKey: ["hadith-edition", prefix, book],
    queryFn: () => fetchEdition(prefix, book),
    enabled: enabled && !!book,
    staleTime: editionStaleTime,
    gcTime: editionStaleTime,
  });
}

export function useHadithChapters(bookSlug: string) {
  const { data, isLoading, error } = useEdition("ben", bookSlug);
  const bnMap = HADITH_CHAPTER_NAMES_BN[bookSlug] || {};
  const chapters: ApiChapter[] | undefined = data
    ? Object.entries(data.metadata.sections)
        .map(([num, name]) => {
          const det = data.metadata.section_details[num];
          const count = det ? det.hadithnumber_last - det.hadithnumber_first + 1 : 0;
          return {
            id: Number(num),
            chapterNumber: num,
            chapterEnglish: name || `Chapter ${num}`,
            chapterBengali: bnMap[num],
            hadithCount: Math.max(0, count),
          };
        })
        .filter((c) => c.id > 0 && c.hadithCount > 0)
    : undefined;
  return { data: chapters, isLoading, error };
}

const PAGE_SIZE = 25;

export function useHadithList(bookSlug: string, chapter: string, page = 1) {
  const { data: bn, isLoading: lBn, error: eBn } = useEdition("ben", bookSlug);
  const { data: ar } = useEdition("ara", bookSlug, !!bookSlug);

  let pageData: ApiHadith[] = [];
  let total = 0;
  let lastPage = 1;
  if (bn) {
    const det = bn.metadata.section_details[chapter];
    if (det) {
      const all = bn.hadiths.filter(
        (h) => h.hadithnumber >= det.hadithnumber_first && h.hadithnumber <= det.hadithnumber_last
      );
      total = all.length;
      lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const start = (page - 1) * PAGE_SIZE;
      const slice = all.slice(start, start + PAGE_SIZE);
      const arMap = new Map<number, string>();
      ar?.hadiths.forEach((h) => arMap.set(h.hadithnumber, h.text));
      pageData = slice.map((h) => ({
        id: h.hadithnumber,
        hadithNumber: String(h.hadithnumber),
        hadithBengali: h.text,
        hadithArabic: arMap.get(h.hadithnumber),
        status: h.grades?.[0]?.grade,
      }));
    }
  }

  return {
    data: bn ? { data: pageData, current_page: page, last_page: lastPage, total } : undefined,
    isLoading: lBn,
    error: eBn,
  };
}

export function useHadithSearch(query: string, bookSlug?: string) {
  // Search across Bengali editions of all six books (cached individually)
  const books = bookSlug ? [bookSlug] : ["bukhari", "muslim", "tirmidhi", "abudawud", "nasai", "ibnmajah"];
  return useQuery({
    queryKey: ["hadith-search", query, books.join(",")],
    queryFn: async (): Promise<ApiHadith[]> => {
      const q = query.trim().toLowerCase();
      if (q.length < 2) return [];
      const editions = await Promise.all(books.map((b) => fetchEdition("ben", b).catch(() => null)));
      const results: ApiHadith[] = [];
      editions.forEach((ed, i) => {
        if (!ed) return;
        for (const h of ed.hadiths) {
          if (h.text && h.text.toLowerCase().includes(q)) {
            results.push({
              id: h.hadithnumber * 100 + i,
              hadithNumber: String(h.hadithnumber),
              hadithBengali: h.text,
              bookSlug: books[i],
            });
            if (results.length >= 30) break;
          }
        }
      });
      return results.slice(0, 30);
    },
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 30,
  });
}
