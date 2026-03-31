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
    },
    {
      icon: Mic,
      title: t("প্র্যাকটিস করুন", "Practice", "تدرب"),
      desc: t("তেলাওয়াত করুন, ভুল ধরা হবে স্বয়ংক্রিয়ভাবে", "Recite and get automatic error detection", "اقرأ واحصل على تصحيح تلقائي"),
      path: "/practice",
    },
    {
      icon: Headphones,
      title: t("অডিও তেলাওয়াত", "Audio Recitation", "الاستماع"),
      desc: t("বিখ্যাত কারীদের তেলাওয়াত শুনুন ও অনুসরণ করুন", "Listen to famous Qaris and follow along", "استمع إلى القراء المشهورين"),
      path: "/audio",
    },
    {
      icon: BookOpen,
      title: t("নামাজ শিক্ষা", "Prayer Guide", "دليل الصلاة"),
      desc: t("চার মাযহাব অনুযায়ী নামাজের নিয়ম ও দোয়া", "Prayer rules & duas according to 4 Madhabs", "أحكام الصلاة حسب المذاهب الأربعة"),
      path: "/prayer",
    },
    {
      icon: Clock,
      title: t("নামাজের সময়সূচী", "Prayer Times", "أوقات الصلاة"),
      desc: t("আপনার লোকেশন অনুযায়ী নামাজের সময়", "Prayer times based on your location", "أوقات الصلاة حسب موقعك"),
      path: "/prayer-times",
    },
    {
      icon: Brain,
      title: t("হিফজ ড্যাশবোর্ড", "Hifz Dashboard", "لوحة الحفظ"),
      desc: t("সব সূরার মুখস্থ অগ্রগতি একনজরে দেখুন", "Track memorization progress across all surahs", "تتبع تقدم الحفظ"),
      path: "/hifz",
    },
    {
      icon: Heart,
      title: t("বুকমার্ক", "Bookmarks", "المحفوظات"),
      desc: t("সেভ করা আয়াতগুলো পড়ুন", "Read your saved ayahs", "اقرأ آياتك المحفوظة"),
      path: "/bookmarks",
    },
  ];

  const lastReadSurah = bookmarks.lastRead
    ? surahList.find((s) => s.number === bookmarks.lastRead!.surah)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="islamic-header relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="font-arabic text-[100px] sm:text-[150px] md:text-[200px] leading-none text-center pt-8 select-none">﷽</div>
        </div>
        <div className="relative z-10 container py-8 text-center">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          {/* Crescent decoration */}
          <div className="text-accent text-3xl mb-2">☪</div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            {t("কুরআন শিক্ষা ও নামাজ", "Quran Learning & Prayer", "تعلم القرآن والصلاة")}
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            {t("পড়ুন, শিখুন, অনুশীলন করুন", "Read, Learn, Practice", "اقرأ، تعلم، تدرب")}
          </p>
        </div>
      </header>

      {/* Main Sections */}
      <main className="container py-8">
        {/* Continue Reading */}
        {lastReadSurah && (
          <Link
            to={`/quran?surah=${bookmarks.lastRead!.surah}&ayah=${bookmarks.lastRead!.ayah}`}
            className="mb-6 block islamic-card p-4 hover:scale-[1.01] relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-xl" />
            <div className="flex items-center gap-3 pl-2">
              <BookMarked className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="text-sm font-semibold text-accent">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {sections.map((section) => (
            <Link
              key={section.path}
              to={section.path}
              className="group block islamic-card p-4 sm:p-6 relative overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Corner ornaments */}
              <span className="corner-ornament top-0 right-0 border-t-2 border-r-2 rounded-tr-lg" />
              <span className="corner-ornament bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg" />

              <div className="inline-flex p-2.5 sm:p-3 rounded-xl bg-primary/10 text-primary mb-3 sm:mb-4 group-hover:scale-110 transition-transform border border-primary/20">
                <section.icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-1.5 sm:mb-2">
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
          <div className="gold-divider mb-4">
            <span className="text-accent/50 text-sm">✦</span>
          </div>
          <p className="font-arabic text-2xl sm:text-3xl md:text-4xl text-primary/60">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          <p className="text-muted-foreground text-sm mt-2">
            {t(
              "পরম করুণাময় অসীম দয়ালু আল্লাহর নামে",
              "In the name of Allah, the Most Gracious, the Most Merciful",
              "بسم الله الرحمن الرحيم"
            )}
          </p>
          <div className="gold-divider mt-4">
            <span className="text-accent/50 text-sm">✦</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
