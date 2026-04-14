import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, History, Plus, Trash2, Volume2, VolumeX, Timer, Play, Pause, Globe, Target } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Moon, Sun } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
const SOUND_KEY = "tasbih-sound-enabled";
const DAILY_TARGET_KEY = "tasbih-daily-target";

function createAudioContext() {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

let audioCtx: AudioContext | null = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = createAudioContext();
  return audioCtx;
}

function playTapSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
}

function playCompleteSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [600, 900].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch {}
}

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
      while (parsed.length < total) parsed.push(0);
      return parsed.slice(0, total);
    }
  } catch {}
  return Array(total).fill(0);
}

interface HistoryEntry {
  date: string;
  total: number;
  sessionTime?: number;
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
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 90)));
}

function loadDailyTarget(): number {
  try {
    const raw = localStorage.getItem(DAILY_TARGET_KEY);
    if (raw) return parseInt(raw) || 0;
  } catch {}
  return 0;
}

function getWeeklyData(history: HistoryEntry[], language: string): { label: string; total: number }[] {
  const now = new Date();
  const days: { label: string; total: number }[] = [];
  const dayNames = language === "bn"
    ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"]
    : language === "ar"
    ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = history.find(h => h.date === dateStr);
    days.push({ label: dayNames[d.getDay()], total: entry?.total || 0 });
  }
  return days;
}

function getMonthlyData(history: HistoryEntry[], language: string): { label: string; total: number }[] {
  const now = new Date();
  const weeks: { label: string; total: number }[] = [];
  
  for (let w = 3; w >= 0; w--) {
    let total = 0;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + d);
      const dateStr = day.toISOString().slice(0, 10);
      const entry = history.find(h => h.date === dateStr);
      total += entry?.total || 0;
    }
    
    const weekLabel = language === "bn" ? `সপ্তাহ ${4 - w}` : language === "ar" ? `أسبوع ${4 - w}` : `Week ${4 - w}`;
    weeks.push({ label: weekLabel, total });
  }
  return weeks;
}

// Ripple type
interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function TasbihPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [customDhikr, setCustomDhikr] = useState<Dhikr[]>(loadCustomDhikr);
  const dhikrList = useMemo(() => [...DEFAULT_DHIKR, ...customDhikr], [customDhikr]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [counts, setCounts] = useState<number[]>(() => loadCounts(dhikrList.length));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem(SOUND_KEY) !== "false"; } catch { return true; }
  });

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Daily target
  const [dailyTarget, setDailyTarget] = useState(loadDailyTarget);
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetInput, setTargetInput] = useState("");

  // Ripple state
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);
  const counterRef = useRef<HTMLButtonElement>(null);

  // Tap scale animation
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionActive]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const [newArabic, setNewArabic] = useState("");
  const [newBn, setNewBn] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newTarget, setNewTarget] = useState("33");

  const dhikr = dhikrList[activeIndex] || dhikrList[0];
  const count = counts[activeIndex] || 0;
  const progress = Math.min((count / dhikr.target) * 100, 100);
  const completed = count >= dhikr.target;

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, String(next));
      return next;
    });
  };

  useEffect(() => {
    setCounts(prev => {
      if (prev.length === dhikrList.length) return prev;
      const next = [...prev];
      while (next.length < dhikrList.length) next.push(0);
      return next.slice(0, dhikrList.length);
    });
  }, [dhikrList.length]);

  useEffect(() => {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return;
    const today = getToday();
    setHistory(prev => {
      const existing = prev.findIndex(h => h.date === today);
      const entry: HistoryEntry = {
        date: today,
        total,
        sessionTime: sessionSeconds,
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
  }, [counts, dhikrList, language, sessionSeconds]);

  const spawnRipple = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const btn = counterRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const id = ++rippleIdRef.current;
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  }, []);

  const increment = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) spawnRipple(e);

    // Tap animation
    setTapped(true);
    setTimeout(() => setTapped(false), 150);

    setCounts((prev) => {
      const next = [...prev];
      next[activeIndex]++;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      if (!sessionStarted) { setSessionStarted(true); setSessionActive(true); }

      if (next[activeIndex] >= dhikrList[activeIndex].target) {
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        if (soundEnabled) playCompleteSound();
        const nextIncomplete = dhikrList.findIndex((d, i) => i > activeIndex && next[i] < d.target);
        const target = nextIncomplete !== -1
          ? nextIncomplete
          : dhikrList.findIndex((d, i) => next[i] < d.target);
        if (target !== -1) {
          setTimeout(() => setActiveIndex(target), 600);
        }
      } else {
        if (navigator.vibrate) navigator.vibrate(15);
        if (soundEnabled) playTapSound();
      }

      return next;
    });
  }, [activeIndex, dhikrList, soundEnabled, spawnRipple, sessionStarted]);

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
    const updated = customDhikr.filter((_, i) => i !== idx);
    setCustomDhikr(updated);
    localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated));
    const globalIdx = DEFAULT_DHIKR.length + idx;
    setCounts(prev => {
      const next = prev.filter((_, i) => i !== globalIdx);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (activeIndex >= dhikrList.length - 1) setActiveIndex(Math.max(0, dhikrList.length - 2));
  };

  const saveDailyTarget = () => {
    const val = Math.max(0, parseInt(targetInput) || 0);
    setDailyTarget(val);
    localStorage.setItem(DAILY_TARGET_KEY, String(val));
    setTargetOpen(false);
  };

  const totalToday = counts.reduce((a, b) => a + b, 0);
  const dailyTargetProgress = dailyTarget > 0 ? Math.min((totalToday / dailyTarget) * 100, 100) : 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    if (language === "bn") {
      const months = ["জানু", "ফেব", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    }
    return d.toLocaleDateString(language === "ar" ? "ar" : "en", { day: "numeric", month: "short" });
  };

  const weeklyData = useMemo(() => getWeeklyData(history, language), [history, language]);
  const monthlyData = useMemo(() => getMonthlyData(history, language), [history, language]);

  const langs = [
    { id: "bn" as const, label: "বাংলা" },
    { id: "en" as const, label: "English" },
    { id: "ar" as const, label: "عربي" },
  ];

  const completedCount = counts.filter((c, i) => c >= (dhikrList[i]?.target || 1)).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ripple styles */}
      <style>{`
        @keyframes ripple-expand {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
        .tasbih-ripple {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: hsl(var(--primary) / 0.25);
          pointer-events: none;
          animation: ripple-expand 0.6s ease-out forwards;
        }
        @keyframes tap-pulse {
          0% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.3); }
          100% { box-shadow: 0 0 0 20px hsl(var(--primary) / 0); }
        }
      `}</style>

      {/* ── Compact Header ── */}
      <header className="islamic-header">
        <div className="container px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-semibold tracking-tight">
              {t("তাসবিহ", "Tasbih", "تسبيح")}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10">
                  <Globe className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-36 p-1.5" align="end">
                {langs.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      language === l.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* ── Feature Toolbar ── */}
      <div className="bg-card border-b border-border">
        <div className="container px-4">
          <div className="flex items-center justify-between py-2 gap-1 overflow-x-auto scrollbar-hide">
            {/* Sound */}
            <button
              onClick={toggleSound}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all min-w-[52px] ${
                soundEnabled ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {t("সাউন্ড", "Sound", "صوت")}
            </button>

            {/* Timer */}
            <button
              onClick={() => {
                if (!sessionStarted) { setSessionStarted(true); setSessionActive(true); }
                else setSessionActive(prev => !prev);
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all min-w-[52px] ${
                sessionActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-1">
                <Timer className="w-4 h-4" />
                {sessionStarted && (sessionActive ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />)}
              </div>
              <span className="font-mono text-[10px]">{formatTimer(sessionSeconds)}</span>
            </button>

            {/* Reset */}
            <button
              onClick={reset}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium text-muted-foreground hover:bg-muted transition-all min-w-[52px]"
            >
              <RotateCcw className="w-4 h-4" />
              {t("রিসেট", "Reset", "إعادة")}
            </button>

            {/* Daily Target */}
            <Dialog open={targetOpen} onOpenChange={setTargetOpen}>
              <DialogTrigger asChild>
                <button
                  onClick={() => setTargetInput(dailyTarget > 0 ? String(dailyTarget) : "")}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all min-w-[52px] ${
                    dailyTarget > 0 ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Target className="w-4 h-4" />
                  {t("লক্ষ্য", "Target", "هدف")}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[340px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-sm">{t("দৈনিক লক্ষ্য সেট করুন", "Set Daily Target", "حدد الهدف اليومي")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "আজ মোট কতবার তাসবিহ পড়তে চান সেই সংখ্যা দিন। ০ দিলে লক্ষ্য বাতিল হবে।",
                      "Enter total tasbih count you want to achieve today. Set 0 to disable.",
                      "أدخل العدد الإجمالي للتسبيح الذي تريد تحقيقه اليوم. اضبط 0 للإلغاء."
                    )}
                  </p>
                  <Input
                    type="number"
                    placeholder={t("যেমন: ৫০০", "e.g. 500", "مثال: ٥٠٠")}
                    value={targetInput}
                    onChange={e => setTargetInput(e.target.value)}
                    min={0}
                  />
                  <Button onClick={saveDailyTarget} className="w-full" size="sm">
                    {t("সেভ করুন", "Save", "حفظ")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium text-muted-foreground hover:bg-muted transition-all min-w-[52px]">
                  <Plus className="w-4 h-4" />
                  {t("যোগ", "Add", "إضافة")}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[340px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-sm">{t("কাস্টম যিকর যোগ করুন", "Add Custom Dhikr", "أضف ذكرًا مخصصًا")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder={t("আরবি টেক্সট", "Arabic text", "النص العربي")} value={newArabic} onChange={e => setNewArabic(e.target.value)} className="font-arabic text-right" dir="rtl" />
                  <Input placeholder={t("বাংলা নাম", "Bengali name", "الاسم البنغالي")} value={newBn} onChange={e => setNewBn(e.target.value)} />
                  <Input placeholder={t("ইংরেজি নাম", "English name", "الاسم الإنجليزي")} value={newEn} onChange={e => setNewEn(e.target.value)} />
                  <Input type="number" placeholder={t("টার্গেট সংখ্যা", "Target count", "العدد المستهدف")} value={newTarget} onChange={e => setNewTarget(e.target.value)} min={1} />
                  <Button onClick={addCustomDhikr} className="w-full" size="sm">{t("যোগ করুন", "Add", "أضف")}</Button>
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
                <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium text-muted-foreground hover:bg-muted transition-all min-w-[52px]">
                  <History className="w-4 h-4" />
                  {t("হিস্ট্রি", "History", "السجل")}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[360px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-sm">{t("তাসবিহ হিস্ট্রি", "Tasbih History", "سجل التسبيح")}</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="weekly" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="weekly" className="text-[11px]">{t("সাপ্তাহিক", "Weekly", "أسبوعي")}</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-[11px]">{t("মাসিক", "Monthly", "شهري")}</TabsTrigger>
                    <TabsTrigger value="list" className="text-[11px]">{t("তালিকা", "List", "قائمة")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="weekly" className="mt-3">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t("তাসবিহ", "Tasbih", "تسبيح")} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>

                  <TabsContent value="monthly" className="mt-3">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                          <Bar dataKey="total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name={t("তাসবিহ", "Tasbih", "تسبيح")} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>

                  <TabsContent value="list" className="mt-3">
                    <ScrollArea className="max-h-[300px]">
                      {history.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">{t("কোনো হিস্ট্রি নেই", "No history yet", "لا يوجد سجل")}</p>
                      ) : (
                        <div className="space-y-2.5">
                          {history.slice(0, 30).map((h, idx) => (
                            <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold">{formatDate(h.date)}</span>
                                <div className="flex items-center gap-2">
                                  {h.sessionTime != null && h.sessionTime > 0 && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                      <Timer className="w-2.5 h-2.5" />
                                      {formatTimer(h.sessionTime)}
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-primary">{h.total} {t("বার", "times", "مرة")}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                {h.details.filter(d => d.count > 0).map((d, di) => (
                                  <div key={di} className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground truncate flex-1">{d.name}</span>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((d.count / d.target) * 100, 100)}%` }} />
                                      </div>
                                      <span className={`text-[10px] font-medium ${d.count >= d.target ? "text-success" : "text-foreground"}`}>{d.count}/{d.target}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-md mx-auto w-full gap-5">
        {/* Daily target progress bar */}
        {dailyTarget > 0 && (
          <div className="w-full space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" />
                {t("দৈনিক লক্ষ্য", "Daily Target", "الهدف اليومي")}
              </span>
              <span className={`font-semibold ${totalToday >= dailyTarget ? "text-success" : "text-foreground"}`}>
                {totalToday}/{dailyTarget}
              </span>
            </div>
            <Progress value={dailyTargetProgress} className="h-2.5" />
            {totalToday >= dailyTarget && (
              <p className="text-[10px] text-success font-medium text-center animate-fade-in">
                🎉 {t("আলহামদুলিল্লাহ! দৈনিক লক্ষ্য পূরণ হয়েছে!", "Alhamdulillah! Daily target achieved!", "الحمد لله! تم تحقيق الهدف اليومي!")}
              </p>
            )}
          </div>
        )}

        {/* Stats strip */}
        <div className="flex items-center justify-center gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{totalToday}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("মোট", "Total", "الكل")}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-2xl font-bold text-accent">{completedCount}<span className="text-sm text-muted-foreground font-normal">/{dhikrList.length}</span></p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("সম্পন্ন", "Done", "مكتمل")}</p>
          </div>
        </div>

        {/* Dhikr selector */}
        <div className="flex items-center justify-center gap-3 w-full">
          <button
            className="shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            onClick={() => setActiveIndex((i) => (i - 1 + dhikrList.length) % dhikrList.length)}
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center text-center py-3 min-h-[72px]">
            <p className="font-arabic text-2xl sm:text-3xl text-primary leading-relaxed">{dhikr.arabic}</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {language === "bn" ? dhikr.bn : language === "ar" ? dhikr.ar : dhikr.en}
            </p>
          </div>
          <button
            className="shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            onClick={() => setActiveIndex((i) => (i + 1) % dhikrList.length)}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Counter circle with ripple */}
        <div className="relative w-52 h-52 sm:w-60 sm:h-60">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
            <circle
              cx="100" cy="100" r="90" fill="none"
              stroke={completed ? "hsl(var(--success))" : "hsl(var(--primary))"}
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              className="transition-all duration-300"
            />
          </svg>

          <button
            ref={counterRef}
            onClick={(e) => increment(e)}
            className={`absolute inset-3 rounded-full bg-card border border-border/50 shadow-md flex flex-col items-center justify-center focus:outline-none overflow-hidden transition-transform duration-150 ${
              tapped ? "scale-[0.95]" : "scale-100"
            }`}
            style={tapped ? { animation: "tap-pulse 0.4s ease-out" } : undefined}
          >
            {/* Ripples */}
            {ripples.map(r => (
              <span
                key={r.id}
                className="tasbih-ripple"
                style={{ left: r.x, top: r.y }}
              />
            ))}
            <span className={`text-5xl font-bold tracking-tight transition-colors duration-200 ${completed ? "text-success" : "text-foreground"}`}>{count}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">/ {dhikr.target}</span>
            {completed && (
              <span className="text-[11px] text-success font-medium mt-1 flex items-center gap-0.5 animate-fade-in">
                ✓ {t("সম্পূর্ণ", "Done", "تم")}
              </span>
            )}
          </button>
        </div>

        {/* Dhikr pills */}
        <div className="flex flex-wrap gap-1.5 justify-center w-full">
          {dhikrList.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${
                i === activeIndex
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : counts[i] >= d.target
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30"
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
