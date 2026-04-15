import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Mic2, Languages, GraduationCap, Bookmark, Grid3X3, Layers, Volume2, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { ActiveSection } from "@/components/quran/types";

import TranslationView from "@/components/quran/TranslationView";
import AudioView from "@/components/quran/AudioView";
import WordMeaningView from "@/components/quran/WordMeaningView";
import HifzView from "@/components/quran/HifzView";
import BookmarksView from "@/components/quran/BookmarksView";
import TopicBrowser from "@/components/quran/TopicBrowser";
import JuzBrowser from "@/components/quran/JuzBrowser";
import ReadingView from "@/components/quran/ReadingView";
import SabinaView from "@/components/quran/SabinaView";

const CATEGORIES = [
  { id: "reading" as const, icon: BookOpen, labelBn: "মুসহাফ", labelEn: "Mushaf", labelAr: "المصحف", active: true },
  { id: "sabina" as const, icon: Sparkles, labelBn: "সবিনা", labelEn: "Sabina", labelAr: "سبينا", active: true },
  { id: "translation" as const, icon: Languages, labelBn: "তরজমা ও তাফসির", labelEn: "Translation", labelAr: "الترجمة", active: true },
  { id: "audio" as const, icon: Volume2, labelBn: "অডিও তেলাওয়াত", labelEn: "Audio", labelAr: "الصوت", active: true },
  { id: "wordmeaning" as const, icon: Mic2, labelBn: "শব্দার্থ", labelEn: "Word Meaning", labelAr: "المعاني", active: true },
  { id: "hifz" as const, icon: GraduationCap, labelBn: "হিফয", labelEn: "Hifz", labelAr: "الحفظ", active: true },
  { id: "bookmarks" as const, icon: Bookmark, labelBn: "বুকমার্ক", labelEn: "Bookmarks", labelAr: "الإشارات", active: true },
  { id: "topics" as const, icon: Grid3X3, labelBn: "বিষয় ভিত্তিক", labelEn: "By Topic", labelAr: "الموضوع", active: true },
  { id: "juz" as const, icon: Layers, labelBn: "জুয ব্রাউজার", labelEn: "Juz Browser", labelAr: "الأجزاء", active: true },
];

export default function QuranPage() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>(() => {
    const s = searchParams.get("surah");
    return s ? "translation" : null;
  });
  const [selectedSurah, setSelectedSurah] = useState(() => {
    const s = searchParams.get("surah");
    return s ? Number(s) : 1;
  });

  const onBack = () => setActiveSection(null);

  if (activeSection === "reading") return <ReadingView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  if (activeSection === "sabina") return <SabinaView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  if (activeSection === "translation") return <TranslationView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  if (activeSection === "audio") return <AudioView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  if (activeSection === "wordmeaning") return <WordMeaningView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  if (activeSection === "hifz") return <HifzView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack} />;
  if (activeSection === "bookmarks") return (
    <BookmarksView selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} onBack={onBack}
      onNavigateToReading={(surah) => { setSelectedSurah(surah); setActiveSection("translation"); }} />
  );
  if (activeSection === "topics") return (
    <TopicBrowser onBack={onBack} onNavigateToSurah={(surah) => { setSelectedSurah(surah); setActiveSection("translation"); }} />
  );
  if (activeSection === "juz") return (
    <JuzBrowser onBack={onBack} onNavigateToSurah={(surah) => { setSelectedSurah(surah); setActiveSection("translation"); }} />
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="islamic-header shrink-0">
        <div className="container flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80 transition-opacity p-1">
              <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
            </Link>
            <div>
              <h1 className="text-lg font-bold font-arabic leading-tight">القرآن الكريم</h1>
              <p className="text-primary-foreground/50 text-[10px]">
                {t("একটি ক্যাটাগরি বেছে নিন", "Choose a category", "اختر فئة")}
              </p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-20">
        <div className="grid grid-cols-4 gap-2.5 w-full max-w-lg mx-auto">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => cat.active && setActiveSection(cat.id)}
                className={`group bg-card rounded-2xl border border-border flex flex-col items-center justify-center py-5 px-3 text-center transition-all duration-200 shadow-sm
                  ${cat.active
                    ? "cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    : "opacity-40 cursor-not-allowed"
                  }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.8} />
                </div>
                <span className="text-xs font-bold text-foreground leading-tight">
                  {language === "bn" ? cat.labelBn : language === "ar" ? cat.labelAr : cat.labelEn}
                </span>
                {!cat.active && (
                  <span className="premium-badge mt-1 text-[8px]">
                    {t("শীঘ্রই আসছে", "Coming soon", "قريباً")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
