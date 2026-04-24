import { useQuery } from "@tanstack/react-query";

// Public hadithapi.com endpoints (free, no key required for read)
// Bengali field is `hadithBengali` on most collections.
const BASE = "https://hadithapi.com/public/api";

export interface ApiHadith {
  id: number;
  hadithNumber: string;
  englishNarrator?: string;
  hadithEnglish?: string;
  hadithUrdu?: string;
  hadithArabic?: string;
  hadithBengali?: string;
  status?: string; // sahih / hasan / da'if
  chapterId?: string;
  bookSlug?: string;
}

export interface ApiChapter {
  id: number;
  chapterNumber: string;
  chapterEnglish: string;
  chapterArabic?: string;
  chapterUrdu?: string;
  bookSlug?: string;
}

interface PaginatedHadiths {
  data: ApiHadith[];
  current_page: number;
  last_page: number;
  total: number;
}

export function useHadithChapters(bookSlug: string) {
  return useQuery({
    queryKey: ["hadith-chapters", bookSlug],
    queryFn: async (): Promise<ApiChapter[]> => {
      const res = await fetch(`${BASE}/${bookSlug}/chapters`);
      if (!res.ok) throw new Error("Failed to load chapters");
      const json = await res.json();
      return json.chapters || json.data || [];
    },
    enabled: !!bookSlug,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useHadithList(bookSlug: string, chapter: string, page = 1) {
  return useQuery({
    queryKey: ["hadith-list", bookSlug, chapter, page],
    queryFn: async (): Promise<PaginatedHadiths> => {
      const params = new URLSearchParams({
        book: bookSlug,
        chapter,
        page: String(page),
        paginate: "25",
      });
      const res = await fetch(`${BASE}/hadiths?${params}`);
      if (!res.ok) throw new Error("Failed to load hadiths");
      const json = await res.json();
      const h = json.hadiths || {};
      return {
        data: h.data || [],
        current_page: h.current_page || page,
        last_page: h.last_page || 1,
        total: h.total || 0,
      };
    },
    enabled: !!bookSlug && !!chapter,
    staleTime: 1000 * 60 * 60,
  });
}

export function useHadithSearch(query: string, bookSlug?: string) {
  return useQuery({
    queryKey: ["hadith-search", query, bookSlug],
    queryFn: async (): Promise<ApiHadith[]> => {
      const params = new URLSearchParams({ hadithBengali: query, paginate: "20" });
      if (bookSlug) params.set("book", bookSlug);
      const res = await fetch(`${BASE}/hadiths?${params}`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      return json.hadiths?.data || [];
    },
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 30,
  });
}
