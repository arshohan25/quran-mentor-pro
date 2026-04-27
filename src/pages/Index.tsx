import {
  BookOpen, Mic, Clock, BookMarked, Heart, Calendar,
  ChevronRight, Hash, CalendarDays, Bell, BellOff, ListChecks, Sparkles,
  Moon, BookText, Volume2, GraduationCap, Compass, HandHeart,
  ScrollText, ClipboardCheck, MessageCircleQuestion, Layers, Flame,
  TrendingUp, MapPin, BarChart3, ArrowRight, Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { surahList } from "@/data/surahList";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AuthChip from "@/components/AuthChip";
import DailyAyah from "@/components/DailyAyah";
import DailyAmalSummaryCard from "@/components/DailyAmalSummaryCard";
import { useDailyDuaNotification } from "@/hooks/useDailyDuaNotification";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { getStreakStats } from "@/hooks/useStreakTracker";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Settings2, Megaphone, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { isTileVisibleIn } from "@/lib/homeTilesManifest";

const DAILY_GOAL_KEY = "daily-minutes-goal";
function loadDailyGoal(): number {
  try {
    const raw = localStorage.getItem(DAILY_GOAL_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n >= 5 && n <= 120 ? n : 20;
  } catch { return 20; }
}

// ---------- helpers ----------
function getHijriToday(localeBn: boolean): string {
  try {
    const fmt = new Intl.DateTimeFormat(
      localeBn ? "bn-u-ca-islamic-umalqura" : "en-u-ca-islamic-umalqura",
      { day: "numeric", month: "long", year: "numeric" }
    );
    return fmt.format(new Date()).replace(" AH", "");
  } catch {
    return "";
  }
}

function parseTimeToday(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

const PRAYER_LABELS_BN: Record<string, string> = {
  Fajr: "ফজর", Dhuhr: "যোহর", Asr: "আসর", Maghrib: "মাগরিব", Isha: "এশা",
};
const PRAYER_LABELS_AR: Record<string, string> = {
  Fajr: "الفجر", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء",
};

function useNextPrayer() {
  const { data, location } = usePrayerTimes();
  return useMemo(() => {
    if (!data) return null;
    const order: (keyof typeof data)[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const now = new Date();
    for (const k of order) {
      const raw = (data as any)[k] as string;
      if (!raw) continue;
      const t = parseTimeToday(raw.slice(0, 5));
      if (t > now) {
        const diff = Math.max(0, t.getTime() - now.getTime());
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return { name: k as string, time: raw.slice(0, 5), inHrs: hrs, inMins: mins, city: location?.city };
      }
    }
    // After Isha → tomorrow Fajr
    return { name: "Fajr", time: (data.Fajr || "").slice(0, 5), inHrs: 0, inMins: 0, city: location?.city, tomorrow: true };
  }, [data, location]);
}

// ---------- bento data ----------
type Tile = {
  icon: any;
  title: string;
  desc?: string;
  path: string;
  gold?: boolean;
  isNew?: boolean;
  span?: 1 | 2;
};

const ANNOUNCEMENT_DISMISS_KEY = "announcement-dismissed-text";

const Index = () => {
  const { t, language } = useLanguage();
  const { bookmarks } = useBookmark();
  const { enabled: duaNotifEnabled, toggleEnabled: toggleDuaNotif, todaysDua, permission: duaPerm, requestPermission: requestDuaPerm } =
    useDailyDuaNotification();
  const nextPrayer = useNextPrayer();
  const { settings: appSettings } = useAppSettings();
  const ui = appSettings.ui;
  const announcement = appSettings.announcement;
  /** Per-tile visibility from admin (default-on for missing keys). */
  const visible = (path: string) => isTileVisibleIn(ui.tiles, path);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState<string | null>(() => {
    try { return localStorage.getItem(ANNOUNCEMENT_DISMISS_KEY); } catch { return null; }
  });
  const showAnnouncement = announcement.enabled && announcement.text && dismissedAnnouncement !== announcement.text;

  const lastReadSurah = bookmarks.lastRead
    ? surahList.find((s) => s.number === bookmarks.lastRead!.surah)
    : null;

  const streak = useMemo(() => {
    try { return getStreakStats(); } catch { return { currentStreak: 0, todayMinutes: 0 } as any; }
  }, []);
  const bookmarkCount = bookmarks.favorites?.length ?? 0;
  const hijri = getHijriToday(language === "bn");

  const [dailyGoal, setDailyGoal] = useState<number>(loadDailyGoal);
  useEffect(() => {
    try { localStorage.setItem(DAILY_GOAL_KEY, String(dailyGoal)); } catch {}
  }, [dailyGoal]);
  const todayMinutes = streak.todayMinutes ?? 0;
  const goalPct = Math.round(Math.min(100, (todayMinutes / dailyGoal) * 100));

  // Sections
  const quranTiles: Tile[] = [
    { icon: BookOpen, title: t("কুরআন পড়ুন", "Read Quran", "اقرأ"), desc: t("সব সূরা ও তাফসির", "All surahs & tafsir"), path: "/quran", span: 2 },
    { icon: Volume2, title: t("অডিও", "Audio", "صوتي"), desc: t("কারীদের তিলাওয়াত", "Reciter audio"), path: "/audio" },
    { icon: GraduationCap, title: t("হিফজ", "Hifz", "حفظ"), desc: t("মুখস্থ ট্র্যাক ও SRS", "Memorize + SRS"), path: "/hifz", gold: true, isNew: true },
    { icon: Mic, title: t("প্র্যাকটিস", "Practice", "تدرب"), desc: t("লাইভ তিলাওয়াত", "Live recitation"), path: "/practice" },
    { icon: BarChart3, title: t("রিসাইটেশন স্ট্যাট", "Recitation Stats", "إحصاءات"), desc: t("শব্দ-হিটম্যাপ", "Word heatmap"), path: "/recitation/stats", gold: true, isNew: true },
    { icon: Layers, title: t("তাফসির তুলনা", "Tafsir Compare", "مقارنة التفسير"), desc: t("৪টি বাংলা তাফসির", "4 Bengali tafsirs"), path: "/tafsir/1/1", isNew: true },
    { icon: Heart, title: t("বুকমার্ক", "Bookmarks", "المحفوظات"), desc: t("সেভ করা আয়াত", "Saved ayahs"), path: "/bookmarks" },
    { icon: Calendar, title: t("প্ল্যানার", "Planner", "مخطط"), desc: t("দৈনিক টার্গেট", "Daily target"), path: "/planner", gold: true },
  ].filter((tile) => visible(tile.path)) as Tile[];

  const prayerTiles: Tile[] = [
    { icon: Clock, title: t("নামাজের সময়", "Prayer Times", "أوقات الصلاة"), desc: t("লোকেশন অনুযায়ী", "Location-based"), path: "/prayer-times", span: 2 },
    { icon: Compass, title: t("কিবলা", "Qibla", "القبلة"), desc: t("দিকনির্দেশ", "Direction"), path: "/qibla", gold: true },
    { icon: BookText, title: t("নামাজ শিক্ষা", "Prayer Guide", "دليل الصلاة"), desc: t("৪ মাযহাব", "4 Madhabs"), path: "/prayer" },
    { icon: ClipboardCheck, title: t("কাযা ট্র্যাকার", "Qaza Tracker", "القضاء"), desc: t("ছুটে যাওয়া নামাজ", "Missed prayers"), path: "/qaza", isNew: true },
  ].filter((tile) => visible(tile.path)) as Tile[];

  const dhikrTiles: Tile[] = [
    { icon: Hash, title: t("তাসবিহ", "Tasbih", "تسبيح"), desc: t("ডিজিটাল কাউন্টার", "Digital counter"), path: "/tasbih" },
    { icon: HandHeart, title: t("দোয়া ও যিকর", "Duas & Azkar", "أدعية"), desc: t("দৈনন্দিন সংগ্রহ", "Daily collection"), path: "/dua", gold: true },
    { icon: ListChecks, title: t("দৈনিক আমল", "Daily Amal", "أعمال يومية"), desc: t("ফযিলতসহ", "With virtues"), path: "/daily-amal" },
    { icon: CalendarDays, title: t("হিজরি ক্যালেন্ডার", "Hijri Calendar", "التقويم"), desc: t("ইসলামিক তারিখ", "Islamic dates"), path: "/hijri", gold: true },
  ].filter((tile) => visible(tile.path)) as Tile[];

  const learnTiles: Tile[] = [
    { icon: ScrollText, title: t("হাদীস লাইব্রেরি", "Hadith Library", "الحديث"), desc: t("সিহাহ সিত্তাহ", "Sahih Sittah"), path: "/hadith", span: 2 },
    { icon: MessageCircleQuestion, title: t("AI প্রশ্ন", "Ask AI", "اسأل"), desc: t("বাংলা Q&A", "Bengali Q&A"), path: "/ask", gold: true, isNew: true },
    { icon: Bell, title: t("নোটিফিকেশন", "Notifications", "تنبيهات"), desc: t("আযান ও রিমাইন্ডার", "Adhan & reminders"), path: "/notifications" },
  ].filter((tile) => visible(tile.path)) as Tile[];

  return (
    <div className="min-h-screen bg-background">
      {visible("card:announcement") && showAnnouncement && (
        <div
          role="status"
          className={`px-4 py-2.5 flex items-center gap-2.5 text-sm border-b ${
            announcement.level === "warn"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : announcement.level === "success"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-primary/10 text-primary border-primary/20"
          }`}
        >
          {announcement.level === "warn" ? <AlertTriangle className="w-4 h-4 shrink-0" /> :
           announcement.level === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
           <Megaphone className="w-4 h-4 shrink-0" />}
          <span className="flex-1 truncate">{announcement.text}</span>
          <button
            onClick={() => {
              try { localStorage.setItem(ANNOUNCEMENT_DISMISS_KEY, announcement.text); } catch {}
              setDismissedAnnouncement(announcement.text);
            }}
            aria-label="Dismiss announcement"
            className="opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* ============ Premium Hero ============ */}
      <header className="islamic-header relative">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none select-none">
          <div className="font-arabic text-[120px] leading-none text-center pt-1">﷽</div>
        </div>
        <div className="relative z-10 container py-5 sm:py-7">
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-foreground/10 flex items-center justify-center backdrop-blur-sm border border-primary-foreground/10">
                <Moon className="w-4.5 h-4.5 text-accent" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold font-bengaliDisplay leading-tight">
                  {t("কুরআন ও নামাজ", "Quran & Prayer", "القرآن والصلاة")}
                </h1>
                <p className="text-primary-foreground/60 text-[10px] sm:text-[11px]">
                  {t("পড়ুন · শিখুন · অনুশীলন করুন", "Read · Learn · Practice", "اقرأ · تعلم · تدرب")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AuthChip />
              <LanguageSwitcher />
            </div>
          </div>

          {/* Hijri + Next prayer chips */}
          <div className="flex gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            {visible("card:hijri_header") && hijri && (
              <div className="flex-1 min-w-0 rounded-xl border border-primary-foreground/10 bg-primary-foreground/[0.06] backdrop-blur-sm px-3 py-2 flex items-center gap-2.5">
                <CalendarDays className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={2} />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-wider text-primary-foreground/50 font-semibold leading-none">
                    {t("আজ হিজরি", "Today · Hijri", "اليوم")}
                  </p>
                  <p className="text-[12px] font-semibold text-primary-foreground/90 truncate mt-0.5">{hijri}</p>
                </div>
              </div>
            )}
            {visible("card:next_prayer") && (
              <Link
                to="/prayer-times"
                className="flex-1 min-w-0 rounded-xl border border-accent/30 bg-accent/10 backdrop-blur-sm px-3 py-2 flex items-center gap-2.5 hover:bg-accent/20 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-wider text-primary-foreground/50 font-semibold leading-none">
                    {t("পরবর্তী নামাজ", "Next Prayer", "الصلاة القادمة")}
                  </p>
                  {nextPrayer ? (
                    <p className="text-[12px] font-semibold text-primary-foreground/95 truncate mt-0.5">
                      {language === "bn" ? PRAYER_LABELS_BN[nextPrayer.name] : language === "ar" ? PRAYER_LABELS_AR[nextPrayer.name] : nextPrayer.name}
                      <span className="text-accent font-bold"> · {nextPrayer.time}</span>
                    </p>
                  ) : (
                    <p className="text-[12px] font-semibold text-primary-foreground/70 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t("লোকেশন সেট করুন", "Set location", "حدد الموقع")}
                    </p>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container py-5 space-y-5">
        {/* ============ Resume / Continue ============ */}
        {lastReadSurah && (
          <Link
            to={`/quran?surah=${bookmarks.lastRead!.surah}&ayah=${bookmarks.lastRead!.ayah}`}
            className="bento-tile-feature block group animate-in fade-in-0 slide-in-from-bottom-3 duration-500"
          >
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" strokeWidth={2.2} />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent">
                  {t("পড়া চালিয়ে যান", "Continue Reading", "أكمل القراءة")}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-primary-foreground/70 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold leading-tight">
                {language === "bn" ? lastReadSurah.bengaliName : lastReadSurah.englishName}
              </h3>
              <p className="text-xs text-primary-foreground/70 mt-0.5">
                {t("সূরা", "Surah", "سورة")} {lastReadSurah.number} · {t("আয়াত", "Ayah", "آية")} {bookmarks.lastRead!.ayah}
                {bookmarks.lastRead!.timestamp && (
                  <span className="opacity-60"> · {new Date(bookmarks.lastRead!.timestamp).toLocaleDateString()}</span>
                )}
              </p>
            </div>
          </Link>
        )}

        {/* ============ Today strip (3 stat chips) ============ */}
        <div className="flex gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          {visible("card:streak_chip") && (
            <Link to="/hifz" className="stat-chip group">
              <div className="icon-container-gold p-1.5 group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4 text-accent" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-none">
                  {t("স্ট্রিক", "Streak", "تتابع")}
                </p>
                <p className="text-sm font-bold text-foreground leading-tight mt-0.5">
                  {streak.currentStreak ?? 0} {t("দিন", "d", "ي")}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          )}
          <div className="stat-chip group flex-col items-start gap-2 relative">
            <Link to="/recitation/stats" className="flex items-center gap-2 w-full">
              <div className="icon-container p-1.5 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-none">
                  {t("আজ অনুশীলন", "Today", "اليوم")}
                </p>
                <p className="text-sm font-bold text-foreground leading-tight mt-0.5 flex items-center gap-1">
                  {todayMinutes}
                  <span className="text-[10px] text-muted-foreground font-medium">/ {dailyGoal} {t("মিনিট", "min", "د")}</span>
                </p>
              </div>
            </Link>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={t("লক্ষ্য সেট করুন", "Set goal", "حدد الهدف")}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-3" align="end" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold">
                    {t("দৈনিক লক্ষ্য", "Daily Goal", "الهدف اليومي")}
                  </h4>
                  <span className="ml-auto text-xs font-bold text-primary">
                    {dailyGoal} {t("মিনিট", "min", "د")}
                  </span>
                </div>
                <Slider
                  value={[dailyGoal]}
                  onValueChange={([v]) => {
                    setDailyGoal(v);
                    toast.success(t("লক্ষ্য আপডেট হয়েছে", "Goal updated", "تم تحديث الهدف"), {
                      description: t(`নতুন লক্ষ্য: ${v} মিনিট`, `New goal: ${v} min`, `الهدف الجديد: ${v} د`),
                    });
                  }}
                  min={5}
                  max={120}
                  step={5}
                />
                <div className="flex flex-wrap gap-1.5">
                  {[10, 15, 20, 30, 45, 60].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDailyGoal(p)}
                      className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                        dailyGoal === p
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {t("রিসাইটেশন স্ট্যাটে আজ লগ মিনিটের ভিত্তিতে অগ্রগতি।", "Progress based on today's logged practice minutes.", "التقدم بناءً على دقائق التدريب اليوم.")}
                </p>
              </PopoverContent>
            </Popover>
            {/* Progress bar */}
            <div className="w-full space-y-1">
              <Progress value={goalPct} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground text-right">{goalPct}%</p>
            </div>
          </div>
          <Link to="/bookmarks" className="stat-chip group">
            <div className="icon-container-gold p-1.5 group-hover:scale-110 transition-transform">
              <BookMarked className="w-4 h-4 text-accent" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-none">
                {t("বুকমার্ক", "Saved", "محفوظ")}
              </p>
              <p className="text-sm font-bold text-foreground leading-tight mt-0.5">
                {bookmarkCount}
              </p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        </div>

        {/* ============ Daily Ayah + Daily Dua ============ */}
        <div className="grid md:grid-cols-2 gap-4">
          {ui.show_daily_ayah && <DailyAyah />}
          <DailyAmalSummaryCard />

          <div className="premium-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`icon-container-gold p-1.5 ${duaNotifEnabled ? '' : 'opacity-50'}`}>
                  {duaNotifEnabled
                    ? <Bell className="w-4 h-4 text-accent" strokeWidth={1.8} />
                    : <BellOff className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />}
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("আজকের দোয়া", "Today's Dua", "دعاء اليوم")}
                </h3>
              </div>
              <Switch
                checked={duaNotifEnabled}
                onCheckedChange={() => {
                  if (duaPerm !== "granted") requestDuaPerm();
                  toggleDuaNotif();
                }}
              />
            </div>
            {todaysDua && (
              <div className="space-y-2 pt-1">
                <p className="font-arabic text-base leading-[2.2] text-foreground">{todaysDua.arabic}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {language === "bn" ? todaysDua.bn : todaysDua.en}
                </p>
                <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {todaysDua.reference}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ============ BENTO SECTIONS ============ */}
        <BentoSection
          eyebrow={t("কুরআন", "Quran", "القرآن")}
          arabic="القرآن الكريم"
          tiles={quranTiles}
        />
        <BentoSection
          eyebrow={t("নামাজ", "Prayer", "الصلاة")}
          arabic="الصلاة"
          tiles={prayerTiles}
        />
        <BentoSection
          eyebrow={t("যিকর ও দোয়া", "Dhikr & Dua", "الذكر والدعاء")}
          arabic="الذكر والدعاء"
          tiles={dhikrTiles}
        />
        <BentoSection
          eyebrow={t("শিখুন ও জিজ্ঞাসা", "Learn & Ask", "تعلم واسأل")}
          arabic="تعلّم"
          tiles={learnTiles}
        />

        {/* Footer */}
        <div className="text-center pt-3 pb-6">
          <div className="gold-divider">
            <span className="text-accent/40 text-sm">✦</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-3 font-arabic">رَّبِّ زِدْنِي عِلْمًا</p>
        </div>
      </main>
    </div>
  );
};

// ---------- Section + Tile components ----------

function BentoSection({ eyebrow, arabic, tiles }: { eyebrow: string; arabic: string; tiles: Tile[] }) {
  return (
    <section className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      <div className="section-eyebrow">
        <span className="label">{eyebrow}</span>
        <span className="line" />
        <span className="ar">{arabic}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {tiles.map((tile) => (
          <BentoTile key={tile.path} tile={tile} />
        ))}
      </div>
    </section>
  );
}

function BentoTile({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  return (
    <Link
      to={tile.path}
      className={`bento-tile group ${tile.gold ? "is-gold" : ""} ${tile.span === 2 ? "col-span-2" : ""}`}
    >
      {tile.isNew && <span className="new-pill">{"NEW"}</span>}
      <div className="flex items-start justify-between">
        <div className={`${tile.gold ? "icon-container-gold" : "icon-container"} p-2.5 group-hover:scale-110 transition-transform`}>
          <Icon
            className={`${tile.gold ? "text-accent" : "text-primary"} ${tile.span === 2 ? "w-5 h-5" : "w-4.5 h-4.5"}`}
            strokeWidth={1.8}
          />
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="mt-auto">
        <h4 className={`font-bold text-card-foreground leading-tight ${tile.span === 2 ? "text-[15px]" : "text-[13px]"}`}>
          {tile.title}
        </h4>
        {tile.desc && (
          <p className="text-muted-foreground text-[11px] leading-snug mt-0.5">{tile.desc}</p>
        )}
      </div>
    </Link>
  );
}

export default Index;
