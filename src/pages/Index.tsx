import { Book, Mic, Headphones, BookOpen, Clock, BookMarked, Brain, Heart, Calendar, ChevronRight, Compass, Hash, BookHeart, CalendarDays, Bell, BellOff } from "lucide-react";
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
    { icon: Book, label: t("কুরআন", "Quran", "القرآن"), path: "/quran", color: "text-primary" },
    { icon: Headphones, label: t("অডিও", "Audio", "صوتي"), path: "/audio", color: "text-primary" },
    { icon: Mic, label: t("প্র্যাকটিস", "Practice", "تدرب"), path: "/practice", color: "text-primary" },
    { icon: Calendar, label: t("প্ল্যানার", "Planner", "مخطط"), path: "/planner", color: "text-primary" },
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
      icon: BookHeart,
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
      icon: BookOpen,
      title: t("নামাজ শিক্ষা", "Prayer Guide", "دليل الصلاة"),
      desc: t("চার মাযহাব অনুযায়ী নামাজ", "Prayer rules by 4 Madhabs", "أحكام الصلاة"),
      path: "/prayer",
    },
    {
      icon: Clock,
      title: t("নামাজের সময়", "Prayer Times", "أوقات الصلاة"),
      desc: t("আপনার লোকেশন অনুযায়ী", "Based on your location", "حسب موقعك"),
      path: "/prayer-times",
    },
    {
      icon: Brain,
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
      {/* Compact Header */}
      <header className="islamic-header relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="font-arabic text-[120px] leading-none text-center pt-4 select-none">﷽</div>
        </div>
        <div className="relative z-10 container py-5 sm:py-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-accent text-xl">☪</span>
              <h1 className="text-lg sm:text-xl font-bold font-bengaliDisplay">
                {t("কুরআন ও নামাজ", "Quran & Prayer", "القرآن والصلاة")}
              </h1>
            </div>
            <LanguageSwitcher />
          </div>
          <p className="text-primary-foreground/70 text-sm">
            {t("পড়ুন, শিখুন, অনুশীলন করুন", "Read, Learn, Practice", "اقرأ، تعلم، تدرب")}
          </p>
        </div>
      </header>

      <main className="container py-5 space-y-5">
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="islamic-card flex flex-col items-center justify-center p-3 sm:p-4 gap-1.5 hover:scale-[1.03] active:scale-[0.97] transition-all"
            >
              <div className="p-2 rounded-xl bg-primary/8">
                <action.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${action.color}`} />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-foreground">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Continue Reading */}
        {lastReadSurah && (
          <Link
            to={`/quran?surah=${bookmarks.lastRead!.surah}&ayah=${bookmarks.lastRead!.ayah}`}
            className="block islamic-card p-3.5 relative overflow-hidden group"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-xl" />
            <div className="flex items-center justify-between pl-2">
              <div className="flex items-center gap-3">
                <BookMarked className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-accent">
                    {t("পড়া চালিয়ে যান", "Continue Reading", "أكمل القراءة")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {language === "bn" ? lastReadSurah.bengaliName : lastReadSurah.englishName} — {t("আয়াত", "Ayah", "آية")} {bookmarks.lastRead!.ayah}
                    {bookmarks.lastRead!.timestamp && (
                      <span className="ml-1 opacity-60">• {new Date(bookmarks.lastRead!.timestamp).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </Link>
        )}

        {/* Reading Progress Widget */}
        <ReadingProgress />

        {/* Daily Ayah */}
        <DailyAyah />

        {/* Daily Dua Reminder */}
        <div className="islamic-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {duaNotifEnabled ? <Bell className="w-4 h-4 text-accent" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
              <h3 className="text-sm font-semibold text-foreground">
                {t("আজকের দোয়া", "Today's Dua", "دعاء اليوم")}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                {t("নোটিফিকেশন", "Notify", "تنبيه")}
              </span>
              <Switch
                checked={duaNotifEnabled}
                onCheckedChange={() => {
                  if (duaPerm !== "granted") {
                    requestDuaPerm();
                  }
                  toggleDuaNotif();
                }}
              />
            </div>
          </div>
          {todaysDua && (
            <div className="space-y-2">
              <p className="font-arabic text-base leading-[2] text-foreground">{todaysDua.arabic}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {language === "bn" ? todaysDua.bn : todaysDua.en}
              </p>
              <p className="text-[10px] text-muted-foreground/60">📖 {todaysDua.reference}</p>
            </div>
          )}
        </div>

        {/* More Features */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {t("আরও ফিচার", "More Features", "المزيد")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {sections.map((section) => (
              <Link
                key={section.path}
                to={section.path}
                className="group islamic-card p-3.5 sm:p-4 relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span className="corner-ornament top-0 right-0 border-t-2 border-r-2 rounded-tr-lg" />
                <span className="corner-ornament bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg" />

                <div className="inline-flex p-2 rounded-lg bg-primary/8 text-primary mb-2 group-hover:scale-110 transition-transform">
                  <section.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-sm font-semibold text-card-foreground mb-0.5">
                  {section.title}
                </h4>
                <p className="text-muted-foreground text-[11px] leading-tight">
                  {section.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer decoration */}
        <div className="text-center pt-2 pb-4">
          <div className="gold-divider">
            <span className="text-accent/40 text-sm">✦</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
