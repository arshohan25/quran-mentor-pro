import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

// Islamic SVG icons as components
const IslamicBookIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6h26a2 2 0 012 2v28a2 2 0 01-2 2H12a4 4 0 01-4-4V6z" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.08"/>
    <path d="M12 38h24" stroke="currentColor" strokeWidth="2"/>
    <path d="M24 14l1.5 3.5 3.5.5-2.5 2.5.8 3.5L24 22l-3.3 2-0.2-3.5-2.5-2.5 3.5-.5z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M18 30h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IslamicMicIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="18" r="8" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.08"/>
    <path d="M24 10c1.2 0 2.2.5 3 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 22a12 12 0 0024 0" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M24 34v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M18 40h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 14a3 3 0 004 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const IslamicWordIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="32" height="28" rx="3" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.06"/>
    <text x="24" y="29" textAnchor="middle" fill="currentColor" fontSize="16" fontFamily="serif" opacity="0.8">عر</text>
    <path d="M14 36h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <path d="M16 14h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

const IslamicHifzIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 10L6 20l18 10 18-10L24 10z" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.08" strokeLinejoin="round"/>
    <path d="M12 23v10c0 2 5.4 5 12 5s12-3 12-5V23" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M42 20v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="24" cy="17" r="2" fill="currentColor" fillOpacity="0.3"/>
  </svg>
);

const IslamicBookmarkIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 6h24v36l-12-8-12 8V6z" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.08" strokeLinejoin="round"/>
    <circle cx="24" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M24 16l1.2 2.5 2.8.4-2 2 .5 2.8L24 22.2l-2.5 1.5.5-2.8-2-2 2.8-.4z" fill="currentColor" fillOpacity="0.5"/>
  </svg>
);

const IslamicMushafIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="8" width="36" height="32" rx="2" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.06"/>
    <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
    <path d="M15 16h6M15 20h5M15 24h6M15 28h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    <path d="M27 16h6M27 20h5M27 24h6M27 28h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    <circle cx="24" cy="14" r="3" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15"/>
  </svg>
);

const IslamicTopicIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.06"/>
    <path d="M24 12v24M12 24h24" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
    <circle cx="24" cy="24" r="4" fill="currentColor" fillOpacity="0.3"/>
    <circle cx="24" cy="16" r="2" fill="currentColor" fillOpacity="0.2"/>
    <circle cx="24" cy="32" r="2" fill="currentColor" fillOpacity="0.2"/>
    <circle cx="16" cy="24" r="2" fill="currentColor" fillOpacity="0.2"/>
    <circle cx="32" cy="24" r="2" fill="currentColor" fillOpacity="0.2"/>
  </svg>
);

const IslamicJuzIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="6" width="32" height="36" rx="3" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.06"/>
    <text x="24" y="28" textAnchor="middle" fill="currentColor" fontSize="14" fontFamily="serif" opacity="0.7">٣٠</text>
    <path d="M14 12h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <path d="M14 36h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  </svg>
);

const CATEGORIES = [
  { id: "translation" as const, icon: IslamicBookIcon, labelBn: "তরজমা ও তাফসির", labelEn: "Translation & Tafsir", labelAr: "الترجمة والتفسير", active: true },
  { id: "audio" as const, icon: IslamicMicIcon, labelBn: "অডিও তেলাওয়াত", labelEn: "Audio Recitation", labelAr: "التلاوة الصوتية", active: true },
  { id: "wordmeaning" as const, icon: IslamicWordIcon, labelBn: "শব্দার্থ", labelEn: "Word Meaning", labelAr: "معاني الكلمات", active: true },
  { id: "hifz" as const, icon: IslamicHifzIcon, labelBn: "হিফয", labelEn: "Hifz", labelAr: "الحفظ", active: true },
  { id: "bookmarks" as const, icon: IslamicBookmarkIcon, labelBn: "বুকমার্ক", labelEn: "Bookmarks", labelAr: "الإشارات المرجعية", active: true },
  { id: "topics" as const, icon: IslamicTopicIcon, labelBn: "বিষয় ভিত্তিক", labelEn: "By Topic", labelAr: "حسب الموضوع", active: true },
  { id: "juz" as const, icon: IslamicJuzIcon, labelBn: "জুয ব্রাউজার", labelEn: "Juz Browser", labelAr: "تصفح الأجزاء", active: true },
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
  if (activeSection === "topics") {
    return (
      <TopicBrowser
        onBack={onBack}
        onNavigateToSurah={(surah) => { setSelectedSurah(surah); setActiveSection("reading"); }}
      />
    );
  }
  if (activeSection === "juz") {
    return (
      <JuzBrowser
        onBack={onBack}
        onNavigateToSurah={(surah) => { setSelectedSurah(surah); setActiveSection("reading"); }}
      />
    );
  }

  // Category Grid
  return (
    <div className="min-h-screen bg-[#F5EFE0] dark:bg-[#1a1510]">
      <header className="bg-[#2D5016] dark:bg-[#1a3009] text-white py-3 md:py-4 shadow-lg">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/" className="hover:opacity-80 transition-opacity"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-lg md:text-xl font-bold font-arabic">القرآن الكريم</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container pb-8">
        <p className="text-[#5C4A2A] dark:text-[#C4A96A]/80 text-sm md:text-base mb-6 text-center font-medium">
          {t("একটি ক্যাটাগরি বেছে নিন", "Choose a category", "اختر فئة")}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-lg mx-auto">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => cat.active && setActiveSection(cat.id)}
                className={`group relative flex flex-col items-center justify-center p-4 md:p-6 text-center transition-all duration-300
                  bg-[#FFFDF7] dark:bg-[#1e1708] rounded-xl
                  border-2 border-[#8B7355]/20 dark:border-[#C4A96A]/20
                  shadow-[0_2px_12px_rgba(92,74,42,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]
                  ${cat.active
                    ? "cursor-pointer hover:border-[#2D5016]/50 dark:hover:border-[#7BAF4C]/40 hover:shadow-[0_4px_20px_rgba(45,80,22,0.15)] hover:scale-[1.03] active:scale-[0.98]"
                    : "opacity-50 cursor-not-allowed"
                  }`}
              >
                <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#8B7355]/30 dark:border-[#C4A96A]/25 rounded-tr-lg" />
                <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#8B7355]/30 dark:border-[#C4A96A]/25 rounded-tl-lg" />
                <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#8B7355]/30 dark:border-[#C4A96A]/25 rounded-br-lg" />
                <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#8B7355]/30 dark:border-[#C4A96A]/25 rounded-bl-lg" />

                <div className={`w-11 h-11 md:w-14 md:h-14 flex items-center justify-center mb-2 md:mb-3 ${
                  cat.active ? "text-[#2D5016] dark:text-[#7BAF4C]" : "text-[#8B7355]/50"
                }`}>
                  <Icon className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <span className={`text-xs md:text-sm font-semibold leading-tight ${
                  cat.active ? "text-[#2D5016] dark:text-[#C4A96A]" : "text-[#8B7355]/50"
                }`}>
                  {language === "bn" ? cat.labelBn : language === "ar" ? cat.labelAr : cat.labelEn}
                </span>
                {!cat.active && (
                  <span className="text-[10px] text-[#8B7355]/40 mt-1">
                    {t("শীঘ্রই আসছে", "Coming soon", "قريباً")}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center mt-8 gap-3">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#8B7355]/30" />
          <span className="text-[#8B7355]/40 dark:text-[#C4A96A]/30 text-lg">✦</span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#8B7355]/30" />
        </div>
      </div>
    </div>
  );
}
