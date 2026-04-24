import { useQueries } from "@tanstack/react-query";
import { TAFSIR_EDITIONS } from "@/hooks/useTafsir";

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

async function fetchOne(surah: number, ayah: number, tafsirId: number) {
  const res = await fetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${surah}:${ayah}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return stripHtml(data?.tafsir?.text || "");
}

export interface TafsirCompareItem {
  edition: typeof TAFSIR_EDITIONS[number];
  text: string;
  isLoading: boolean;
  error: unknown;
}

/**
 * Fetches all configured Bengali tafsirs in parallel for a given ayah.
 * Each one is cached for 24 hours and shares cache keys with useTafsir.
 */
export function useTafsirCompare(surah: number, ayah: number, enabled: boolean): TafsirCompareItem[] {
  const queries = useQueries({
    queries: TAFSIR_EDITIONS.map(ed => ({
      queryKey: ["tafsir", surah, ayah, ed.id],
      queryFn: () => fetchOne(surah, ayah, ed.id),
      enabled: enabled && surah > 0 && ayah > 0,
      staleTime: 1000 * 60 * 60 * 24,
      retry: 1,
    })),
  });

  return TAFSIR_EDITIONS.map((edition, i) => ({
    edition,
    text: queries[i].data ?? "",
    isLoading: queries[i].isLoading,
    error: queries[i].error,
  }));
}
