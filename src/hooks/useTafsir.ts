import { useQuery } from "@tanstack/react-query";

export interface TafsirEdition {
  id: number;
  name: string;
  bnLabel: string;
  enLabel: string;
}

// Bengali / English tafsir ids on quran.com API v4
export const TAFSIR_EDITIONS: TafsirEdition[] = [
  { id: 164, name: "ibn-kathir-bn", bnLabel: "তাফসীর ইবনে কাসীর", enLabel: "Tafsir Ibn Kathir (Bn)" },
  { id: 165, name: "fathul-majid", bnLabel: "ফাতহুল মাজীদ", enLabel: "Fathul Majid (Bn)" },
  { id: 166, name: "tafhimul-quran", bnLabel: "তাফহীমুল কুরআন", enLabel: "Tafhimul Quran (Bn)" },
  { id: 169, name: "ahsanul-bayan", bnLabel: "আহসানুল বায়ান", enLabel: "Ahsanul Bayan (Bn)" },
];

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

interface TafsirResponse {
  tafsir?: { text?: string };
}

async function fetchTafsir(surah: number, ayah: number, tafsirId: number): Promise<string> {
  const verseKey = `${surah}:${ayah}`;
  const res = await fetch(
    `https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${verseKey}`,
  );
  if (!res.ok) throw new Error("Failed to load tafsir");
  const data: TafsirResponse = await res.json();
  return stripHtml(data.tafsir?.text || "");
}

export function useTafsir(surah: number, ayah: number, tafsirId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["tafsir", surah, ayah, tafsirId],
    queryFn: () => fetchTafsir(surah, ayah, tafsirId),
    enabled: enabled && surah > 0 && ayah > 0,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}
