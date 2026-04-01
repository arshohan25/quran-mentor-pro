import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, BarChart3, CheckCircle, Circle, GraduationCap, Mic } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import SurahSelector from "./SurahSelector";
import SurahNav from "./SurahNav";
import PageNav from "./PageNav";
import { LINES_PER_PAGE, type QuranSectionProps } from "./types";

const HIFZ_KEY = "hifz-progress";

function loadHifzProgress(): Record<number, number[]> {
  try { return JSON.parse(localStorage.getItem(HIFZ_KEY) || "{}"); } catch { return {}; }
}

export default function HifzView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t, language } = useLanguage();
  const [page, setPage] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const [hiddenAyahs, setHiddenAyahs] = useState<Set<number>>(new Set());
  const [hifzProgress, setHifzProgress] = useState<Record<number, number[]>>(loadHifzProgress);

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);
  const currentSurah = surahList.find((s) => s.number === selectedSurah);

  useEffect(() => { setPage(0); setHiddenAyahs(new Set()); }, [selectedSurah]);

  const isMemorized = (surah: number, ayahNum: number) => (hifzProgress[surah] || []).includes(ayahNum);

  const toggleMemorized = (surah: number, ayahNum: number) => {
    setHifzProgress(prev => {
      const list = prev[surah] || [];
      const next = list.includes(ayahNum)
        ? { ...prev, [surah]: list.filter(a => a !== ayahNum) }
        : { ...prev, [surah]: [...list, ayahNum] };
      localStorage.setItem(HIFZ_KEY, JSON.stringify(next));
      return next;
    });
  };

  const markAllMemorized = (surah: number, ayahNums: number[]) => {
    setHifzProgress(prev => {
      const list = prev[surah] || [];
      const allDone = ayahNums.every(a => list.includes(a));
      const next = allDone
        ? { ...prev, [surah]: list.filter(a => !ayahNums.includes(a)) }
        : { ...prev, [surah]: [...new Set([...list, ...ayahNums])] };
      localStorage.setItem(HIFZ_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleHideAyah = (num: number) => {
    setHiddenAyahs(prev => { const next = new Set(prev); if (next.has(num)) next.delete(num); else next.add(num); return next; });
  };

  const hifzPages = useMemo(() => {
    if (!data) return [];
    const ayahs = data.arabic.ayahs;
    const result: typeof ayahs[] = [];
    for (let i = 0; i < ayahs.length; i += LINES_PER_PAGE) result.push(ayahs.slice(i, i + LINES_PER_PAGE));
    return result;
  }, [data]);

  const totalPages = hifzPages.length;
  const clampedPage = Math.min(page, Math.max(0, totalPages - 1));
  const currentAyahs = hifzPages[clampedPage] || [];
  const allHidden = currentAyahs.length > 0 && currentAyahs.every(a => hiddenAyahs.has(a.number));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-base md:text-lg font-bold">{t("হিফয প্র্যাকটিস", "Hifz Practice", "تمرين الحفظ")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDashboard(!showDashboard)}
                className={`p-1.5 rounded-lg transition-colors ${showDashboard ? "bg-primary-foreground/20 text-primary-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"}`}>
                <BarChart3 className="w-4 h-4" />
              </button>
              {!showDashboard && (
                <>
                  <button onClick={() => {
                    if (allHidden) setHiddenAyahs(prev => { const n = new Set(prev); currentAyahs.forEach(a => n.delete(a.number)); return n; });
                    else setHiddenAyahs(prev => { const n = new Set(prev); currentAyahs.forEach(a => n.add(a.number)); return n; });
                  }} className="p-1.5 rounded-lg bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors">
                    {allHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <SurahSelector value={selectedSurah} onChange={setSelectedSurah} />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container py-4 max-w-2xl mx-auto">
        {showDashboard ? (() => {
          const totalMemorized = Object.values(hifzProgress).reduce((sum, arr) => sum + arr.length, 0);
          const totalAyahsAll = surahList.reduce((sum, s) => sum + s.numberOfAyahs, 0);
          const overallPct = totalAyahsAll > 0 ? Math.round((totalMemorized / totalAyahsAll) * 100) : 0;
          const surahsWithProgress = surahList.filter(s => (hifzProgress[s.number] || []).length > 0);
          const completedSurahs = surahList.filter(s => (hifzProgress[s.number] || []).length >= s.numberOfAyahs);
          return (
            <div className="space-y-4">
              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t("সামগ্রিক প্রগ্রেস", "Overall Progress", "التقدم العام")}</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-primary/5 rounded-lg p-2"><p className="text-lg font-bold text-primary">{totalMemorized}</p><p className="text-[10px] text-muted-foreground">{t("আয়াত মুখস্থ", "Ayahs memorized", "آيات محفوظة")}</p></div>
                  <div className="bg-primary/5 rounded-lg p-2"><p className="text-lg font-bold text-primary">{completedSurahs.length}</p><p className="text-[10px] text-muted-foreground">{t("সূরা সম্পূর্ণ", "Surahs complete", "سور مكتملة")}</p></div>
                  <div className="bg-primary/5 rounded-lg p-2"><p className="text-lg font-bold text-primary">{overallPct}%</p><p className="text-[10px] text-muted-foreground">{t("সম্পূর্ণ", "Complete", "مكتمل")}</p></div>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} /></div>
              </Card>
              <h3 className="text-sm font-semibold text-foreground">{t("সূরা অনুযায়ী প্রগ্রেস", "Progress by Surah", "التقدم حسب السورة")}</h3>
              {surahsWithProgress.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">{t("এখনও কোন সূরা শুরু হয়নি", "No surahs started yet", "لم تبدأ أي سورة بعد")}</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-340px)]">
                  <div className="space-y-2">
                    {surahList.map(s => {
                      const memorized = (hifzProgress[s.number] || []).length;
                      if (memorized === 0) return null;
                      const pct = Math.round((memorized / s.numberOfAyahs) * 100);
                      const isComplete = memorized >= s.numberOfAyahs;
                      return (
                        <button key={s.number} onClick={() => { setSelectedSurah(s.number); setShowDashboard(false); }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isComplete ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>{isComplete ? "✓" : s.number}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground truncate">{language === "bn" ? s.bengaliName : s.englishName}</span>
                              <span className="text-xs text-muted-foreground shrink-0 ml-2">{memorized}/{s.numberOfAyahs}</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${isComplete ? "bg-primary" : "bg-primary/60"}`} style={{ width: `${pct}%` }} /></div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          );
        })() : (
          <>
            {currentSurah && (
              <div className="bg-primary/5 rounded-xl p-4 mb-4 text-center space-y-2">
                {clampedPage === 0 && (
                  <>
                    <h2 className="font-arabic text-2xl text-primary">{currentSurah.name}</h2>
                    <p className="text-foreground font-semibold text-sm">{language === "bn" ? currentSurah.bengaliName : currentSurah.englishName}</p>
                  </>
                )}
                {(() => {
                  const memorizedCount = (hifzProgress[selectedSurah] || []).length;
                  const totalAyahs = currentSurah.numberOfAyahs;
                  const pct = totalAyahs > 0 ? Math.round((memorizedCount / totalAyahs) * 100) : 0;
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t("মুখস্থ", "Memorized", "محفوظ")}</span>
                        <span className="font-semibold text-primary">{memorizedCount}/{totalAyahs} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                      {pct === 100 && <p className="text-xs text-primary font-semibold">{t("🎉 আলহামদুলিল্লাহ! সম্পূর্ণ মুখস্থ!", "🎉 Alhamdulillah! Fully memorized!", "🎉 الحمد لله! تم الحفظ كاملاً!")}</p>}
                    </div>
                  );
                })()}
                <p className="text-[10px] text-muted-foreground">{t("ট্যাপ = লুকান/দেখান • ✓ = মুখস্থ চিহ্নিত", "Tap = hide/show • ✓ = mark memorized", "اضغط = إخفاء/إظهار • ✓ = تحديد كمحفوظ")}</p>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">{[...Array(LINES_PER_PAGE)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}</div>
            ) : currentAyahs.length > 0 ? (
              <div className="rounded-xl border border-border bg-card p-4 md:p-6">
                <div className="space-y-1" dir="rtl">
                  {currentAyahs.map((ayah) => {
                    const isHidden = hiddenAyahs.has(ayah.number);
                    const memorized = isMemorized(selectedSurah, ayah.numberInSurah);
                    return (
                      <div key={ayah.number} className={`flex items-center gap-1 py-1.5 border-b border-border/30 last:border-b-0 rounded transition-all ${memorized ? "bg-primary/8" : ""}`}>
                        <button onClick={() => toggleMemorized(selectedSurah, ayah.numberInSurah)} className="p-0.5 shrink-0" dir="ltr">
                          {memorized ? <CheckCircle className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4 text-muted-foreground/40" />}
                        </button>
                        <button onClick={() => toggleHideAyah(ayah.number)}
                          className={`flex-1 flex items-baseline gap-2 py-0.5 px-1 text-right rounded transition-all ${isHidden ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"}`}>
                          <span className="text-[10px] text-muted-foreground font-bold min-w-[20px] text-center shrink-0 font-sans" dir="ltr">{ayah.numberInSurah}</span>
                          <span className={`font-arabic text-lg md:text-xl lg:text-2xl leading-[2.2] flex-1 transition-all ${isHidden ? "blur-md select-none text-muted-foreground" : "text-foreground"}`}>{ayah.text}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-center">
                  <button onClick={() => markAllMemorized(selectedSurah, currentAyahs.map(a => a.numberInSurah))} className="text-xs text-primary hover:underline">
                    {currentAyahs.every(a => isMemorized(selectedSurah, a.numberInSurah))
                      ? t("এই পৃষ্ঠা আনমার্ক করুন", "Unmark this page", "إلغاء تحديد الصفحة")
                      : t("এই পৃষ্ঠা মুখস্থ চিহ্নিত করুন", "Mark this page as memorized", "تحديد الصفحة كمحفوظة")}
                  </button>
                </div>
              </div>
            ) : null}

            <PageNav currentPage={clampedPage} totalPages={totalPages}
              onPrev={() => clampedPage > 0 ? setPage(clampedPage - 1) : selectedSurah > 1 && (setSelectedSurah(selectedSurah - 1), setPage(999))}
              onNext={() => clampedPage < totalPages - 1 ? setPage(clampedPage + 1) : selectedSurah < 114 && (setSelectedSurah(selectedSurah + 1), setPage(0))}
              disablePrev={clampedPage === 0 && selectedSurah <= 1}
              disableNext={clampedPage >= totalPages - 1 && selectedSurah >= 114}
            />
            <SurahNav selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} />
          </>
        )}
      </div>
    </div>
  );
}
