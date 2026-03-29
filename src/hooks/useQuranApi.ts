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
