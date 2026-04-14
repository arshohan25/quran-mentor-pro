import { useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, History, Plus, Trash2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Dhikr {
  arabic: string;
  bn: string;
  en: string;
  ar: string;
  target: number;
  custom?: boolean;
}

const DEFAULT_DHIKR: Dhikr[] = [
  { arabic: "سُبْحَانَ اللّٰهِ", bn: "সুবহানাল্লাহ", en: "SubhanAllah", ar: "سبحان الله", target: 33 },
  { arabic: "الْحَمْدُ لِلّٰهِ", bn: "আলহামদুলিল্লাহ", en: "Alhamdulillah", ar: "الحمد لله", target: 33 },
  { arabic: "اللّٰهُ أَكْبَرُ", bn: "আল্লাহু আকবার", en: "Allahu Akbar", ar: "الله أكبر", target: 34 },
  { arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ", bn: "লা ইলাহা ইল্লাল্লাহ", en: "La ilaha illallah", ar: "لا إله إلا الله", target: 100 },
  { arabic: "أَسْتَغْفِرُ اللّٰهَ", bn: "আস্তাগফিরুল্লাহ", en: "Astaghfirullah", ar: "أستغفر الله", target: 100 },
  { arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ", bn: "লা হাওলা ওয়ালা কুওয়াতা ইল্লা বিল্লাহ", en: "La hawla wa la quwwata illa billah", ar: "لا حول ولا قوة إلا بالله", target: 33 },
];

const STORAGE_KEY = "tasbih-counts";
const CUSTOM_DHIKR_KEY = "tasbih-custom-dhikr";
const HISTORY_KEY = "tasbih-history";

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadCustomDhikr(): Dhikr[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DHIKR_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function loadCounts(total: number): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Pad if new dhikr added
      while (parsed.length < total) parsed.push(0);
      return parsed.slice(0, total);
    }
  } catch {}
  return Array(total).fill(0);
}

interface HistoryEntry {
  date: string;
  total: number;
  details: { name: string; count: number; target: number }[];
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveHistory(history: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 90))); // keep 90 days
}

export default function TasbihPage() {
  const { t, language } = useLanguage();
  const [customDhikr, setCustomDhikr] = useState<Dhikr[]>(loadCustomDhikr);
  const dhikrList = useMemo(() => [...DEFAULT_DHIKR, ...customDhikr], [customDhikr]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [counts, setCounts] = useState<number[]>(() => loadCounts(dhikrList.length));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  // Form state for custom dhikr
  const [newArabic, setNewArabic] = useState("");
  const [newBn, setNewBn] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newTarget, setNewTarget] = useState("33");

  const dhikr = dhikrList[activeIndex] || dhikrList[0];
  const count = counts[activeIndex] || 0;
  const progress = Math.min((count / dhikr.target) * 100, 100);
  const completed = count >= dhikr.target;

  // Sync counts array length when dhikrList changes
  useEffect(() => {
    setCounts(prev => {
      if (prev.length === dhikrList.length) return prev;
      const next = [...prev];
      while (next.length < dhikrList.length) next.push(0);
      return next.slice(0, dhikrList.length);
    });
  }, [dhikrList.length]);

  // Save today's history on count change
  useEffect(() => {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return;
    const today = getToday();
    setHistory(prev => {
      const existing = prev.findIndex(h => h.date === today);
      const entry: HistoryEntry = {
        date: today,
        total,
        details: dhikrList.map((d, i) => ({
          name: language === "bn" ? d.bn : language === "ar" ? d.ar : d.en,
          count: counts[i] || 0,
          target: d.target,
        })),
      };
      const next = [...prev];
      if (existing !== -1) next[existing] = entry;
      else next.unshift(entry);
      saveHistory(next);
      return next;
    });
  }, [counts, dhikrList, language]);

  const increment = useCallback(() => {
    setCounts((prev) => {
      const next = [...prev];
      next[activeIndex]++;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      if (next[activeIndex] >= dhikrList[activeIndex].target) {
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        const nextIncomplete = dhikrList.findIndex((d, i) => i > activeIndex && next[i] < d.target);
        const target = nextIncomplete !== -1
          ? nextIncomplete
          : dhikrList.findIndex((d, i) => next[i] < d.target);
        if (target !== -1) {
          setTimeout(() => setActiveIndex(target), 600);
        }
      } else {
        if (navigator.vibrate) navigator.vibrate(15);
      }

      return next;
    });
  }, [activeIndex, dhikrList]);

  const reset = useCallback(() => {
    setCounts((prev) => {
      const next = [...prev];
      next[activeIndex] = 0;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [activeIndex]);

  const addCustomDhikr = () => {
    const text = newArabic.trim() || newEn.trim() || newBn.trim();
    if (!text) return;
    const d: Dhikr = {
      arabic: newArabic.trim() || text,
      bn: newBn.trim() || text,
      en: newEn.trim() || text,
      ar: newArabic.trim() || text,
      target: Math.max(1, parseInt(newTarget) || 33),
      custom: true,
    };
    const updated = [...customDhikr, d];
    setCustomDhikr(updated);
    localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated));
    setNewArabic(""); setNewBn(""); setNewEn(""); setNewTarget("33");
    setAddOpen(false);
  };

  const removeCustomDhikr = (idx: number) => {
    // idx is relative to customDhikr array
    const updated = customDhikr.filter((_, i) => i !== idx);
    setCustomDhikr(updated);
    localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated));
    // Also remove the count
    const globalIdx = DEFAULT_DHIKR.length + idx;
    setCounts(prev => {
      const next = prev.filter((_, i) => i !== globalIdx);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (activeIndex >= dhikrList.length - 1) setActiveIndex(Math.max(0, dhikrList.length - 2));
  };

  const totalToday = counts.reduce((a, b) => a + b, 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    if (language === "bn") {
      const months = ["জানু", "ফেব", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    }
    return d.toLocaleDateString(language === "ar" ? "ar" : "en", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-lg font-bold">{t("তাসবিহ কাউন্টার", "Tasbih Counter", "عداد التسبيح")}</h1>
          </div>
          <div className="flex items-center gap-1">
            {/* Add custom dhikr */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[340px] rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-sm">{t("কাস্টম যিকর যোগ করুন", "Add Custom Dhikr", "أضف ذكرًا مخصصًا")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder={t("আরবি টেক্সট", "Arabic text", "النص العربي")}
                    value={newArabic}
                    onChange={e => setNewArabic(e.target.value)}
                    className="font-arabic text-right"
                    dir="rtl"
                  />
                  <Input
                    placeholder={t("বাংলা নাম", "Bengali name", "الاسم البنغالي")}
                    value={newBn}
                    onChange={e => setNewBn(e.target.value)}
                  />
                  <Input
                    placeholder={t("ইংরেজি নাম", "English name", "الاسم الإنجليزي")}
                    value={newEn}
                    onChange={e => setNewEn(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={t("টার্গেট সংখ্যা", "Target count", "العدد المستهدف")}
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    min={1}
                  />
                  <Button onClick={addCustomDhikr} className="w-full" size="sm">
                    {t("যোগ করুন", "Add", "أضف")}
                  </Button>

                  {customDhikr.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] text-muted-foreground mb-2">{t("আপনার যিকরসমূহ", "Your Dhikr", "أذكارك")}</p>
                      {customDhikr.map((cd, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5">
                          <span className="text-xs truncate flex-1">
                            {language === "bn" ? cd.bn : language === "ar" ? cd.ar : cd.en}
                            <span className="text-muted-foreground ml-1">({cd.target})</span>
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeCustomDhikr(i)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* History */}
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <History className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[340px] rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-sm">{t("তাসবিহ হিস্ট্রি", "Tasbih History", "سجل التسبيح")}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[400px]">
                  {history.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">{t("কোনো হিস্ট্রি নেই", "No history yet", "لا يوجد سجل")}</p>
                  ) : (
                    <div className="space-y-3">
                      {history.slice(0, 30).map((h, idx) => (
                        <div key={idx} className="islamic-card p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold">{formatDate(h.date)}</span>
                            <span className="text-xs font-bold text-primary">{h.total} {t("বার", "times", "مرة")}</span>
                          </div>
                          <div className="space-y-1">
                            {h.details.filter(d => d.count > 0).map((d, di) => (
                              <div key={di} className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground truncate flex-1">{d.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary transition-all"
                                      style={{ width: `${Math.min((d.count / d.target) * 100, 100)}%` }}
                                    />
                                  </div>
                                  <span className={`text-[10px] font-medium ${d.count >= d.target ? "text-success" : "text-foreground"}`}>
                                    {d.count}/{d.target}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="container py-6 flex flex-col items-center gap-5 max-w-sm mx-auto">
        {/* Dhikr selector */}
        <div className="flex items-center gap-3 w-full">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setActiveIndex((i) => (i - 1 + dhikrList.length) % dhikrList.length)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center islamic-card p-3">
            <p className="font-arabic text-2xl text-primary leading-relaxed">{dhikr.arabic}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "bn" ? dhikr.bn : language === "ar" ? dhikr.ar : dhikr.en}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setActiveIndex((i) => (i + 1) % dhikrList.length)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Counter circle */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
            <circle
              cx="100" cy="100" r="90" fill="none"
              stroke={completed ? "hsl(var(--success))" : "hsl(var(--primary))"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              className="transition-all duration-300"
            />
          </svg>

          <button
            onClick={increment}
            className="absolute inset-4 rounded-full bg-card border-2 border-accent/20 shadow-lg flex flex-col items-center justify-center active:scale-95 transition-transform focus:outline-none hover:border-accent/40"
          >
            <span className={`text-5xl font-bold ${completed ? "text-success" : "text-foreground"}`}>
              {count}
            </span>
            <span className="text-xs text-muted-foreground mt-1">/ {dhikr.target}</span>
            {completed && <span className="text-xs text-success font-medium mt-1">✓ {t("সম্পূর্ণ", "Done", "تم")}</span>}
          </button>
        </div>

        {/* Reset */}
        <Button variant="outline" size="sm" onClick={reset} className="gap-2">
          <RotateCcw className="w-3.5 h-3.5" />
          {t("রিসেট", "Reset", "إعادة")}
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="islamic-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalToday}</p>
            <p className="text-[10px] text-muted-foreground">{t("মোট গণনা", "Total Count", "العدد الكلي")}</p>
          </div>
          <div className="islamic-card p-3 text-center">
            <p className="text-2xl font-bold text-accent">{counts.filter((c, i) => c >= (dhikrList[i]?.target || 1)).length}/{dhikrList.length}</p>
            <p className="text-[10px] text-muted-foreground">{t("সম্পন্ন", "Completed", "مكتمل")}</p>
          </div>
        </div>

        {/* Quick dhikr pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {dhikrList.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${
                i === activeIndex
                  ? "bg-primary text-primary-foreground border-primary"
                  : counts[i] >= d.target
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-card text-muted-foreground border-border hover:border-accent/40"
              }`}
            >
              {language === "bn" ? d.bn : language === "ar" ? d.ar : d.en}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
