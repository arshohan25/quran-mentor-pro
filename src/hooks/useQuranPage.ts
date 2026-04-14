import { useQuery } from "@tanstack/react-query";

export interface PageVerse {
  verse_key: string;
  chapter_id: number;
  verse_number: number;
  text_uthmani: string;
}

export interface QuranPageData {
  verses: PageVerse[];
  pagination: { total_records: number };
}

/**
 * Fetch all verses for a given Mushaf page (1-604) from quran.com API v4.
 */
export function useQuranPage(pageNumber: number) {
  return useQuery<QuranPageData>({
    queryKey: ["quran-page", pageNumber],
    queryFn: async () => {
      const res = await fetch(
        `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?language=ar&fields=text_uthmani,chapter_id,verse_number&per_page=50`
      );
      if (!res.ok) throw new Error(`Failed to load page ${pageNumber}`);
      const data = await res.json();
      return {
        verses: data.verses.map((v: any) => ({
          verse_key: v.verse_key,
          chapter_id: v.chapter_id,
          verse_number: v.verse_number,
          text_uthmani: v.text_uthmani,
        })),
        pagination: data.pagination,
      };
    },
    enabled: pageNumber >= 1 && pageNumber <= 604,
    staleTime: 1000 * 60 * 60 * 24, // 24h cache
  });
}
