import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";

interface Dhikr {
  arabic: string;
  bn: string;
  en: string;
  ar: string;
  target: number;
}

const DHIKR_LIST: Dhikr[] = [
  { arabic: "سُبْحَانَ اللّٰهِ", bn: "সুবহানাল্লাহ", en: "SubhanAllah", ar: "سبحان الله", target: 33 },
  { arabic: "الْحَمْدُ لِلّٰهِ", bn: "আলহামদুলিল্লাহ", en: "Alhamdulillah", ar: "الحمد لله", target: 33 },
  { arabic: "اللّٰهُ أَكْبَرُ", bn: "আল্লাহু আকবার", en: "Allahu Akbar", ar: "الله أكبر", target: 34 },
  { arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ", bn: "লা ইলাহা ইল্লাল্লাহ", en: "La ilaha illallah", ar: "لا إله إلا الله", target: 100 },
  { arabic: "أَسْتَغْفِرُ اللّٰهَ", bn: "আস্তাগফিরুল্লাহ", en: "Astaghfirullah", ar: "أستغفر الله", target: 100 },
  { arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ", bn: "লা হাওলা ওয়ালা কুওয়াতা ইল্লা বিল্লাহ", en: "La hawla wa la quwwata illa billah", ar: "لا حول ولا قوة إلا بالله", target: 33 },
];

const STORAGE_KEY = "tasbih-counts";

function loadCounts(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DHIKR_LIST.map(() => 0);
}

export default function TasbihPage() {
  const { t, language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [counts, setCounts] = useState<number[]>(loadCounts);
  const dhikr = DHIKR_LIST[activeIndex];
  const count = counts[activeIndex];
  const progress = Math.min((count / dhikr.target) * 100, 100);
  const completed = count >= dhikr.target;

  const increment = useCallback(() => {
    setCounts((prev) => {
      const next = [...prev];
      next[activeIndex]++;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(15);
  }, [activeIndex]);

  const reset = useCallback(() => {
    setCounts((prev) => {
      const next = [...prev];
      next[activeIndex] = 0;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [activeIndex]);

  const totalToday = counts.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-lg font-bold">{t("তাসবিহ কাউন্টার", "Tasbih Counter", "عداد التسبيح")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container py-6 flex flex-col items-center gap-5 max-w-sm mx-auto">
        {/* Dhikr selector */}
        <div className="flex items-center gap-3 w-full">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setActiveIndex((i) => (i - 1 + DHIKR_LIST.length) % DHIKR_LIST.length)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center islamic-card p-3">
            <p className="font-arabic text-2xl text-primary leading-relaxed">{dhikr.arabic}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "bn" ? dhikr.bn : language === "ar" ? dhikr.ar : dhikr.en}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setActiveIndex((i) => (i + 1) % DHIKR_LIST.length)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Counter circle */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64">
          {/* Progress ring */}
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

          {/* Tap area */}
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
            <p className="text-2xl font-bold text-accent">{counts.filter((c, i) => c >= DHIKR_LIST[i].target).length}/{DHIKR_LIST.length}</p>
            <p className="text-[10px] text-muted-foreground">{t("সম্পন্ন", "Completed", "مكتمل")}</p>
          </div>
        </div>

        {/* Quick dhikr pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {DHIKR_LIST.map((d, i) => (
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
