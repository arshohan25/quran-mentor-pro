import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Flame, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeakestWords } from "@/hooks/useRecitationStats";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { tokenizeArabicWords } from "@/utils/arabicUtils";
import { surahList } from "@/data/surahList";
import SessionList from "@/components/recitation/SessionList";
import AccuracyTrend from "@/components/recitation/AccuracyTrend";
import WordHeatmap from "@/components/recitation/WordHeatmap";

function surahName(n: number) {
  return surahList.find(s => s.number === n)?.englishName ?? `Surah ${n}`;
}

function WeakWordRow({ surah, ayah, word_index, errors, hesitations, attempts, onClick }: any) {
  const { data } = useSurahWithTranslations(surah);
  const word = useMemo(() => {
    if (!data) return "…";
    const a = data.arabic.ayahs.find(x => x.numberInSurah === ayah);
    if (!a) return "…";
    return tokenizeArabicWords(a.text)[word_index] ?? "…";
  }, [data, ayah, word_index]);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 py-2 px-2 hover:bg-muted/50 rounded transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-arabic text-lg shrink-0" dir="rtl">{word}</span>
        <span className="text-xs text-muted-foreground truncate">{surahName(surah)} · {ayah}</span>
      </div>
      <span className="text-xs text-destructive font-medium tabular-nums shrink-0">
        {errors + hesitations}/{attempts}
      </span>
    </button>
  );
}

export default function RecitationStatsPage() {
  const { user, loading } = useAuth();
  const [selected, setSelected] = useState<{ surah: number; ayah: number } | null>(null);
  const { data: weakest, isLoading: loadingWeak } = useWeakestWords(15);

  if (loading) {
    return <div className="flex justify-center pt-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="container py-3 flex items-center gap-2">
            <Link to="/" className="p-2 -ml-2 rounded hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-lg font-semibold">Recitation Stats</h1>
          </div>
        </header>
        <div className="container py-12 text-center space-y-3">
          <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Sign in to track your recitation accuracy and find weak spots.</p>
          <Link to="/auth" className="inline-block text-sm font-medium text-primary underline">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/hifz" className="p-2 -ml-2 rounded hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Recitation Stats
          </h1>
        </div>
      </header>

      <div className="container py-4 space-y-4 pb-20">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">Accuracy trend</h2>
          <AccuracyTrend days={7} />
        </section>

        {selected && (
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                Heatmap · {surahName(selected.surah)} · Ayah {selected.ayah}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >Clear</button>
            </div>
            <WordHeatmap surah={selected.surah} ayah={selected.ayah} />
          </section>
        )}

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-2">Recent sessions</h2>
          <SessionList onSelect={(surah, ayah) => setSelected({ surah, ayah })} />
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-destructive" />
            Weakest words
          </h2>
          {loadingWeak ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : !weakest || weakest.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">No weak words detected yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {weakest.map((w, i) => (
                <li key={`${w.surah}-${w.ayah}-${w.word_index}-${i}`}>
                  <WeakWordRow {...w} onClick={() => setSelected({ surah: w.surah, ayah: w.ayah })} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
