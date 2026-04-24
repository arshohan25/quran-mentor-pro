import { useMemo } from "react";
import { tokenizeArabicWords } from "@/utils/arabicUtils";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useAyahHeatmap } from "@/hooks/useRecitationStats";
import { Loader2 } from "lucide-react";

interface Props {
  surah: number;
  ayah: number;
}

function rateColor(rate: number) {
  if (rate <= 0.1) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
  if (rate <= 0.3) return "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40";
  return "bg-destructive/20 text-destructive border-destructive/40";
}

export default function WordHeatmap({ surah, ayah }: Props) {
  const { data: surahData, isLoading: loadingSurah } = useSurahWithTranslations(surah);
  const { data: stats, isLoading: loadingStats } = useAyahHeatmap(surah, ayah);

  const words = useMemo(() => {
    if (!surahData) return [] as string[];
    const a = surahData.arabic.ayahs.find(x => x.numberInSurah === ayah);
    return a ? tokenizeArabicWords(a.text) : [];
  }, [surahData, ayah]);

  const statsByIdx = useMemo(() => {
    const m = new Map<number, NonNullable<typeof stats>[number]>();
    (stats ?? []).forEach(s => m.set(s.word_index, s));
    return m;
  }, [stats]);

  if (loadingSurah || loadingStats) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }
  if (words.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Ayah not found.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
        {words.map((w, i) => {
          const s = statsByIdx.get(i);
          const attempts = s?.attempts ?? 0;
          const errs = (s?.errors ?? 0) + (s?.hesitations ?? 0);
          const rate = attempts > 0 ? errs / Math.max(attempts, 1) : 0;
          const cls = attempts === 0
            ? "bg-muted/40 text-muted-foreground border-border"
            : rateColor(rate);
          return (
            <span
              key={i}
              title={attempts > 0 ? `Attempts ${attempts} · Errors ${s?.errors} · Hesitations ${s?.hesitations}` : "No data"}
              className={`font-arabic text-lg md:text-xl px-2 py-1 rounded border ${cls}`}
            >
              {w}
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground" dir="ltr">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" />Strong</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/40" />Shaky</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/30 border border-destructive/40" />Weak</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted/40 border border-border" />Untested</span>
      </div>
    </div>
  );
}
