import { useQuery } from "@tanstack/react-query";

export interface PageVerse {
  verse_key: string;
  chapter_id: number;
  verse_number: number;
  text_uthmani: string;
}

export interface PageLineWord {
  verse_key: string;
  chapter_id: number;
  verse_number: number;
  text_uthmani: string;
  line_number: number;
  position: number;
  isEndOfVerse: boolean;
  isStartOfVerse: boolean;
}

export interface MushafLine {
  line_number: number;
  words: PageLineWord[];
}

export interface QuranPageData {
  verses: PageVerse[];
  lines: MushafLine[];
  pagination: { total_records: number };
}

interface QuranApiWord {
  verse_key: string;
  text_uthmani: string;
  line_number?: number;
  position: number;
  char_type_name?: string;
}

interface QuranApiVerse {
  verse_key: string;
  chapter_id?: number;
  verse_number: number;
  text_uthmani?: string;
  words?: QuranApiWord[];
}

interface QuranApiResponse {
  verses: QuranApiVerse[];
  pagination: { total_records: number };
}

/**
 * Fetch all verses and exact Mushaf line data for a given page (1-604) from quran.com API v4.
 */
export function useQuranPage(pageNumber: number) {
  return useQuery<QuranPageData>({
    queryKey: ["quran-page", pageNumber],
    queryFn: async () => {
      const res = await fetch(
        `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?language=ar&fields=text_uthmani,chapter_id,verse_number&words=true&word_fields=text_uthmani,line_number,position,verse_key&per_page=50`
      );
      if (!res.ok) throw new Error(`Failed to load page ${pageNumber}`);
      const data = (await res.json()) as QuranApiResponse;

      const linesMap = new Map<number, PageLineWord[]>();

      for (const verse of data.verses) {
        const chapterId = verse.chapter_id ?? Number(verse.verse_key.split(":")[0]);
        const verseWords = (verse.words ?? []).filter(
          (word): word is QuranApiWord & { line_number: number } =>
            word.char_type_name === "word" && typeof word.line_number === "number"
        );

        verseWords.forEach((word, index) => {
          const lineWord: PageLineWord = {
            verse_key: verse.verse_key,
            chapter_id: chapterId,
            verse_number: verse.verse_number,
            text_uthmani: word.text_uthmani,
            line_number: word.line_number,
            position: word.position,
            isEndOfVerse: index === verseWords.length - 1,
          };

          const existingWords = linesMap.get(word.line_number) ?? [];
          existingWords.push(lineWord);
          linesMap.set(word.line_number, existingWords);
        });
      }

      return {
        verses: data.verses.map((verse) => ({
          verse_key: verse.verse_key,
          chapter_id: verse.chapter_id ?? Number(verse.verse_key.split(":")[0]),
          verse_number: verse.verse_number,
          text_uthmani: verse.text_uthmani ?? "",
        })),
        lines: [...linesMap.entries()]
          .sort(([lineA], [lineB]) => lineA - lineB)
          .map(([line_number, words]) => ({
            line_number,
            words,
          })),
        pagination: data.pagination,
      };
    },
    enabled: pageNumber >= 1 && pageNumber <= 604,
    staleTime: 1000 * 60 * 60 * 24, // 24h cache
  });
}
