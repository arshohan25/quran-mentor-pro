import { Book, Mic, Headphones, BookOpen, Clock, BookMarked, Brain, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { surahList } from "@/data/surahList";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import DailyAyah from "@/components/DailyAyah";

const Index = () => {
  const { t, language } = useLanguage();
  const { bookmarks } = useBookmark();

  const sections = [
    {
      icon: Book,
      title: t("কুরআন পড়ুন", "Read Quran", "اقرأ القرآن"),
      desc: t("আরবি টেক্সট, বাংলা ও ইংরেজি তরজমা সহ", "Arabic text with Bengali & English translation", "النص العربي مع ترجمة"),
      path: "/quran",
      gradient: "from-primary to-primary/80",
    },
    {
      icon: Mic,
      title: t("প্র্যাকটিস করুন", "Practice", "تدرب"),
      desc: t("তেলাওয়াত করুন, ভুল ধরা হবে স্বয়ংক্রিয়ভাবে", "Recite and get automatic error detection", "اقرأ واحصل على تصحيح تلقائي"),
      path: "/practice",
      gradient: "from-accent to-secondary",
    },
    {
      icon: Headphones,
      title: t("অডিও তেলাওয়াত", "Audio Recitation", "الاستماع"),
      desc: t("বিখ্যাত কারীদের তেলাওয়াত শুনুন ও অনুসরণ করুন", "Listen to famous Qaris and follow along", "استمع إلى القراء المشهورين"),
      path: "/audio",
      gradient: "from-secondary to-accent",
    },
    {
      icon: BookOpen,
      title: t("নামাজ শিক্ষা", "Prayer Guide", "دليل الصلاة"),
      desc: t("চার মাযহাব অনুযায়ী নামাজের নিয়ম ও দোয়া", "Prayer rules & duas according to 4 Madhabs", "أحكام الصلاة حسب المذاهب الأربعة"),
      path: "/prayer",
      gradient: "from-primary/80 to-accent",
    },
    {
      icon: Clock,
      title: t("নামাজের সময়সূচী", "Prayer Times", "أوقات الصلاة"),
      desc: t("আপনার লোকেশন অনুযায়ী নামাজের সময়", "Prayer times based on your location", "أوقات الصلاة حسب موقعك"),
      path: "/prayer-times",
      gradient: "from-accent to-primary",
    },
    {
      icon: Brain,
      title: t("হিফজ ড্যাশবোর্ড", "Hifz Dashboard", "لوحة الحفظ"),
      desc: t("সব সূরার মুখস্থ অগ্রগতি একনজরে দেখুন", "Track memorization progress across all surahs", "تتبع تقدم الحفظ"),
      path: "/hifz",
      gradient: "from-primary to-secondary",
    },
  ];

  const lastReadSurah = bookmarks.lastRead
    ? surahList.find((s) => s.number === bookmarks.lastRead!.surah)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-10">
          <div className="font-arabic text-[200px] leading-none text-center pt-8 select-none">﷽</div>
        </div>
        <div className="relative z-10 container py-8 text-center">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {t("কুরআন শিক্ষা ও নামাজ", "Quran Learning & Prayer", "تعلم القرآن والصلاة")}
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            {t("পড়ুন, শিখুন, অনুশীলন করুন", "Read, Learn, Practice", "اقرأ، تعلم، تدرب")}
          </p>
        </div>
      </header>

      {/* Main Sections */}
      <main className="container py-8">
        {/* Bookmark / Continue Reading */}
        {lastReadSurah && (
          <Link
            to={`/quran?surah=${bookmarks.lastRead!.surah}&ayah=${bookmarks.lastRead!.ayah}`}
            className="mb-6 block rounded-xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookMarked className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary">
                  {t("পড়া চালিয়ে যান", "Continue Reading", "أكمل القراءة")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "bn" ? lastReadSurah.bengaliName : lastReadSurah.englishName} — {t("আয়াত", "Ayah", "آية")} {bookmarks.lastRead!.ayah}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Daily Ayah */}
        <DailyAyah />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <Link
              key={section.path}
              to={section.path}
              className="group block rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${section.gradient} text-primary-foreground mb-4 group-hover:scale-110 transition-transform`}>
                <section.icon className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-semibold text-card-foreground mb-2">
                {section.title}
              </h2>
              <p className="text-muted-foreground text-sm">
                {section.desc}
              </p>
            </Link>
          ))}
        </div>

        {/* Bismillah decoration */}
        <div className="mt-12 text-center">
          <p className="font-arabic text-4xl text-primary/60">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          <p className="text-muted-foreground text-sm mt-2">
            {t(
              "পরম করুণাময় অসীম দয়ালু আল্লাহর নামে",
              "In the name of Allah, the Most Gracious, the Most Merciful",
              "بسم الله الرحمن الرحيم"
            )}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
