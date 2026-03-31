import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, BookText, Headphones, Languages, GraduationCap, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Card } from "@/components/ui/card";
import type { ActiveSection } from "@/components/quran/types";
import ReadingView from "@/components/quran/ReadingView";
import TranslationView from "@/components/quran/TranslationView";
import AudioView from "@/components/quran/AudioView";
import WordMeaningView from "@/components/quran/WordMeaningView";
import HifzView from "@/components/quran/HifzView";
import BookmarksView from "@/components/quran/BookmarksView";

const CATEGORIES = [
  
  { id: "translation" as const, icon: BookText, labelBn: "তরজমা ও তাফসির", labelEn: "Translation & Tafsir", labelAr: "الترجمة والتفسير", active: true },
  { id: "audio" as const, icon: Headphones, labelBn: "অডিও তেলাওয়াত", labelEn: "Audio Recitation", labelAr: "التلاوة الصوتية", active: true },
  { id: "wordmeaning" as const, icon: Languages, labelBn: "শব্দার্থ", labelEn: "Word Meaning", labelAr: "معاني الكلمات", active: true },
  { id: "hifz" as const, icon: GraduationCap, labelBn: "হিফয", labelEn: "Hifz", labelAr: "الحفظ", active: true },
  { id: "bookmarks" as const, icon: Star, labelBn: "বুকমার্ক", labelEn: "Bookmarks", labelAr: "الإشارات المرجعية", active: true },
];

export default function QuranPage() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>(() => {
    const s = searchParams.get("surah");
    return s ? "reading" : null;
  });
  const [selectedSurah, setSelectedSurah] = useState(() => {
    const s = searchParams.get("surah");
    return s ? Number(s) : 1;
  });

  const onBack = () => setActiveSection(null);

  // Section views
  if (activeSection === "reading") {
    return <ReadingView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  }
  if (activeSection === "translation") {
    return <TranslationView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  }
  if (activeSection === "audio") {
    return <AudioView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  }
  if (activeSection === "wordmeaning") {
    return <WordMeaningView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  }
  if (activeSection === "hifz") {
    return <HifzView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  }
  if (activeSection === "bookmarks") {
    return (
      <BookmarksView
        selectedSurah={selectedSurah}
        setSelectedSurah={setSelectedSurah}
        onBack={onBack}
        onNavigateToReading={(surah) => { setSelectedSurah(surah); setActiveSection("reading"); }}
      />
    );
  }

  // Category Grid
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3 md:py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-lg md:text-xl font-bold">{t("কুরআন", "Quran", "القرآن")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-6 md:py-8">
        <p className="text-muted-foreground text-sm md:text-base mb-6 text-center">
          {t("একটি ক্যাটাগরি বেছে নিন", "Choose a category", "اختر فئة")}
        </p>
        <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-lg mx-auto">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card
                key={cat.id}
                onClick={() => cat.active && setActiveSection(cat.id)}
                className={`flex flex-col items-center justify-center p-4 md:p-6 text-center transition-all ${
                  cat.active
                    ? "cursor-pointer hover:border-primary hover:shadow-md hover:bg-primary/5"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-2 md:mb-3 ${
                  cat.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className={`text-xs md:text-sm font-medium leading-tight ${
                  cat.active ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {language === "bn" ? cat.labelBn : language === "ar" ? cat.labelAr : cat.labelEn}
                </span>
                {!cat.active && (
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {t("শীঘ্রই আসছে", "Coming soon", "قريباً")}
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
