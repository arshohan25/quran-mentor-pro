import {
  BookOpen, Mic, Headphones, Clock, BookMarked, Brain, Heart, Calendar,
  ChevronRight, Hash, CalendarDays, Bell, BellOff, ListChecks, Sparkles,
  Moon, Star, BookText, Volume2, GraduationCap, MapPin, Compass, HandHeart
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { surahList } from "@/data/surahList";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import DailyAyah from "@/components/DailyAyah";
import ReadingProgress from "@/components/ReadingProgress";
import { useDailyDuaNotification } from "@/hooks/useDailyDuaNotification";
import { Switch } from "@/components/ui/switch";

const Index = () => {
  const { t, language } = useLanguage();
  const { bookmarks } = useBookmark();
  const { enabled: duaNotifEnabled, toggleEnabled: toggleDuaNotif, todaysDua, permission: duaPerm, requestPermission: requestDuaPerm } = useDailyDuaNotification();

  const quickActions = [
    { icon: BookOpen, label: t("কুরআন", "Quran", "القرآن"), path: "/quran", gradient: "from-primary/15 to-primary/5" },
    { icon: Volume2, label: t("অডিও", "Audio", "صوتي"), path: "/audio", gradient: "from-accent/15 to-accent/5" },
    { icon: Mic, label: t("প্র্যাকটিস", "Practice", "تدرب"), path: "/practice", gradient: "from-primary/15 to-primary/5" },
    { icon: Calendar, label: t("প্ল্যানার", "Planner", "مخطط"), path: "/planner", gradient: "from-accent/15 to-accent/5" },
  ];

  const sections = [
    {
      icon: Compass,
      title: t("কিবলা ফাইন্ডার", "Qibla Finder", "مكتشف القبلة"),
      desc: t("কিবলার দিক জানুন", "Find Qibla direction", "اعرف اتجاه القبلة"),
      path: "/qibla",
    },
    {
      icon: Hash,
      title: t("তাসবিহ", "Tasbih Counter", "عداد التسبيح"),
      desc: t("ডিজিটাল তাসবিহ গণনা", "Digital dhikr counter", "عداد الذكر الرقمي"),
      path: "/tasbih",
    },
    {
      icon: HandHeart,
      title: t("দোয়া ও যিকর", "Duas & Azkar", "الأدعية والأذكار"),
      desc: t("দৈনন্দিন দোয়া সংগ্রহ", "Daily dua collection", "مجموعة الأدعية"),
      path: "/dua",
    },
    {
      icon: CalendarDays,
      title: t("হিজরি ক্যালেন্ডার", "Hijri Calendar", "التقويم الهجري"),
      desc: t("ইসলামিক তারিখ ও দিন", "Islamic dates & events", "التواريخ الإسلامية"),
      path: "/hijri",
    },
    {
      icon: ListChecks,
      title: t("দৈনিক আমল", "Daily Amal", "الأعمال اليومية"),
      desc: t("রেফারেন্সসহ দৈনিক আমল ও ফযিলত", "Daily deeds with references", "الأعمال اليومية مع المراجع"),
      path: "/daily-amal",
    },
    {
      icon: BookText,
      title: t("নামাজ শিক্ষা", "Prayer Guide", "دليل الصلاة"),
      desc: t("চার মাযহাব অনুযায়ী নামাজ", "Prayer by 4 Madhabs", "أحكام الصلاة"),
      path: "/prayer",
    },
    {
      icon: Clock,
      title: t("নামাজের সময়", "Prayer Times", "أوقات الصلاة"),
      desc: t("আপনার লোকেশন অনুযায়ী", "Based on your location", "حسب موقعك"),
      path: "/prayer-times",
    },
    {
      icon: GraduationCap,
      title: t("হিফজ", "Hifz Dashboard", "لوحة الحفظ"),
      desc: t("মুখস্থ অগ্রগতি দেখুন", "Track memorization", "تتبع الحفظ"),
      path: "/hifz",
    },
    {
      icon: Heart,
      title: t("বুকমার্ক", "Bookmarks", "المحفوظات"),
      desc: t("সেভ করা আয়াত", "Saved ayahs", "الآيات المحفوظة"),
      path: "/bookmarks",
    },
  ];

  const lastReadSurah = bookmarks.lastRead
    ? surahList.find((s) => s.number === bookmarks.lastRead!.surah)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="islamic-header relative">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="font-arabic text-[100px] leading-none text-center pt-2 select-none">﷽</div>
        </div>
        <div className="relative z-10 container py-5 sm:py-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-foreground/10 flex items-center justify-center backdrop-blur-sm">
                <Moon className="w-4.5 h-4.5 text-accent" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold font-bengaliDisplay leading-tight">
                  {t("কুরআন ও নামাজ", "Quran & Prayer", "القرآن والصلاة")}
                </h1>
                <p className="text-primary-foreground/60 text-[11px] sm:text-xs">
                  {t("পড়ুন, শিখুন, অনুশীলন করুন", "Read, Learn, Practice", "اقرأ، تعلم، تدرب")}
                </p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="container py-5 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2.5">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="premium-card flex flex-col items-center justify-center p-3.5 gap-2 hover:scale-[1.04] active:scale-[0.97] transition-all"
            >
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.gradient}`}>
                <action.icon className="w-5 h-5 text-primary" strokeWidth={1.8} />
              </div>
              <span className="text-[11px] font-semibold text-foreground">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Continue Reading */}
        {lastReadSurah && (
          <Link
            to={`/quran?surah=${bookmarks.lastRead!.surah}&ayah=${bookmarks.lastRead!.ayah}`}
            className="block premium-card p-4 relative overflow-hidden group"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: 'linear-gradient(to bottom, hsl(var(--accent)), hsl(var(--primary)))' }} />
            <div className="flex items-center justify-between pl-3">
              <div className="flex items-center gap-3">
                <div className="icon-container-gold p-2">
                  <BookMarked className="w-4 h-4 text-accent" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-bold text-accent flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    {t("পড়া চালিয়ে যান", "Continue Reading", "أكمل القراءة")}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {language === "bn" ? lastReadSurah.bengaliName : lastReadSurah.englishName} — {t("আয়াত", "Ayah", "آية")} {bookmarks.lastRead!.ayah}
                    {bookmarks.lastRead!.timestamp && (
                      <span className="ml-1 opacity-50">• {new Date(bookmarks.lastRead!.timestamp).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </Link>
        )}

        {/* Reading Progress */}
        <ReadingProgress />

        {/* Daily Ayah */}
        <DailyAyah />

        {/* Daily Dua */}
        <div className="premium-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`icon-container p-1.5 ${duaNotifEnabled ? '' : 'opacity-50'}`}>
                {duaNotifEnabled ? <Bell className="w-4 h-4 text-accent" strokeWidth={1.8} /> : <BellOff className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />}
              </div>
              <h3 className="text-sm font-bold text-foreground">
                {t("আজকের দোয়া", "Today's Dua", "دعاء اليوم")}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-medium">
                {t("নোটিফিকেশন", "Notify", "تنبيه")}
              </span>
              <Switch
                checked={duaNotifEnabled}
                onCheckedChange={() => {
                  if (duaPerm !== "granted") requestDuaPerm();
                  toggleDuaNotif();
                }}
              />
            </div>
          </div>
          {todaysDua && (
            <div className="space-y-2 pt-1">
              <p className="font-arabic text-base leading-[2.2] text-foreground">{todaysDua.arabic}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {language === "bn" ? todaysDua.bn : todaysDua.en}
              </p>
              <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {todaysDua.reference}
              </p>
            </div>
          )}
        </div>

        {/* More Features */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
            <h3 className="text-sm font-bold text-foreground">
              {t("আরও ফিচার", "More Features", "المزيد")}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {sections.map((section) => (
              <Link
                key={section.path}
                to={section.path}
                className="group premium-card p-3.5 relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <div className="icon-container p-2 mb-2.5 w-fit group-hover:scale-110 transition-transform">
                  <section.icon className="w-4.5 h-4.5 text-primary" strokeWidth={1.8} />
                </div>
                <h4 className="text-[13px] font-bold text-card-foreground mb-0.5 leading-tight">
                  {section.title}
                </h4>
                <p className="text-muted-foreground text-[11px] leading-snug">
                  {section.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 pb-5">
          <div className="gold-divider">
            <span className="text-accent/30 text-sm">✦</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
