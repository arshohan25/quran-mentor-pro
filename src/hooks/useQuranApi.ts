import { useQuery } from "@tanstack/react-query";

const BASE_URL = "https://api.alquran.cloud/v1";

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  ayahs: Ayah[];
}

export interface SurahEdition {
  edition: { identifier: string; language: string; name: string; englishName: string };
  ayahs: Ayah[];
}

export function useSurah(surahNumber: number, edition = "quran-uthmani") {
  return useQuery<SurahData>({
    queryKey: ["surah", surahNumber, edition],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/surah/${surahNumber}/${edition}`);
      const data = await res.json();
      if (data.code !== 200) throw new Error(data.data || "Failed to load surah");
      return data.data;
    },
    enabled: surahNumber > 0,
    staleTime: 1000 * 60 * 60,
  });
}

export function useSurahWithTranslations(surahNumber: number) {
  return useQuery<{ arabic: SurahEdition; bengali: SurahEdition; english: SurahEdition }>({
    queryKey: ["surah-translations", surahNumber],
    queryFn: async () => {
      const editions = "quran-uthmani,bn.bengali,en.sahih";
      const res = await fetch(`${BASE_URL}/surah/${surahNumber}/editions/${editions}`);
      const data = await res.json();
      if (data.code !== 200) throw new Error("Failed to load translations");
      return {
        arabic: data.data[0],
        bengali: data.data[1],
        english: data.data[2],
      };
    },
    enabled: surahNumber > 0,
    staleTime: 1000 * 60 * 60,
  });
}

export function useAyahAudio(surahNumber: number, ayahNumber: number, qariId: string) {
  return useQuery<string>({
    queryKey: ["ayah-audio", surahNumber, ayahNumber, qariId],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/ayah/${surahNumber}:${ayahNumber}/${qariId}`);
      const data = await res.json();
      if (data.code !== 200) throw new Error("Failed to load audio");
      return data.data.audio;
    },
    enabled: surahNumber > 0 && ayahNumber > 0,
    staleTime: 1000 * 60 * 60,
  });
}

export interface WordData {
  id: number;
  position: number;
  text_uthmani: string;
  translation: { text: string; language_name: string };
  transliteration: { text: string };
}

export interface VerseWords {
  verse_key: string;
  verse_number: number;
  words: WordData[];
}

export function useWordByWord(surahNumber: number, translationLang = "bn") {
  return useQuery<VerseWords[]>({
    queryKey: ["word-by-word", surahNumber, translationLang],
    queryFn: async () => {
      const allVerses: VerseWords[] = [];
      let page = 1;
      let totalPages = 1;
      while (page <= totalPages) {
        const res = await fetch(
          `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=${translationLang}&words=true&word_fields=text_uthmani&translation_fields=text&per_page=50&page=${page}`
        );
        const data = await res.json();
        totalPages = data.pagination?.total_pages || 1;
        for (const verse of data.verses) {
          allVerses.push({
            verse_key: verse.verse_key,
            verse_number: verse.verse_number,
            words: verse.words
              .filter((w: any) => w.char_type_name === "word")
              .map((w: any) => ({
                id: w.id,
                position: w.position,
                text_uthmani: w.text_uthmani,
                translation: w.translation || { text: "", language_name: "" },
                transliteration: w.transliteration || { text: "" },
              })),
          });
        }
        page++;
      }
      return allVerses;
    },
    enabled: surahNumber > 0,
    staleTime: 1000 * 60 * 60,
  });
}

export function useSurahAudio(surahNumber: number, qariId: string) {
  return useQuery<Ayah[]>({
    queryKey: ["surah-audio", surahNumber, qariId],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/surah/${surahNumber}/${qariId}`);
      const data = await res.json();
      if (data.code !== 200) throw new Error("Failed to load audio");
      return data.data.ayahs;
    },
    enabled: surahNumber > 0,
    staleTime: 1000 * 60 * 60,
  });
}
