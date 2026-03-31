import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, BookText, Headphones, Languages, GraduationCap, Star, ChevronLeft, ChevronRight, Palette, Search } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useSurahWithTranslations, useWordByWord, useSurahAudio } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { juzList } from "@/data/juzData";
import { useBookmark } from "@/hooks/useBookmark";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import TajweedText, { TajweedLegend } from "@/components/TajweedText";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

type ActiveSection = null | "reading" | "translation" | "audio" | "wordmeaning" | "hifz" | "bookmarks";

const LINES_PER_PAGE = 15;

const CATEGORIES = [
  { id: "reading" as const, icon: BookOpen, labelBn: "কুরআন তেলাওয়াত", labelEn: "Quran Reading", labelAr: "تلاوة القرآن", active: true },
  { id: "translation" as const, icon: BookText, labelBn: "তরজমা ও তাফসির", labelEn: "Translation & Tafsir", labelAr: "الترجمة والتفسير", active: true },
  { id: "audio" as const, icon: Headphones, labelBn: "অডিও তেলাওয়াত", labelEn: "Audio Recitation", labelAr: "التلاوة الصوتية", active: false },
  { id: "wordmeaning" as const, icon: Languages, labelBn: "শব্দার্থ", labelEn: "Word Meaning", labelAr: "معاني الكلمات", active: false },
  { id: "hifz" as const, icon: GraduationCap, labelBn: "হিফয", labelEn: "Hifz", labelAr: "الحفظ", active: false },
  { id: "bookmarks" as const, icon: Star, labelBn: "বুকমার্ক", labelEn: "Bookmarks", labelAr: "الإشارات المرجعية", active: false },
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
  const [currentPage, setCurrentPage] = useState(0);
  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("tajweedEnabled") !== "false"; } catch { return true; }
  });

  const { data, isLoading } = useSurahWithTranslations(activeSection === "reading" ? selectedSurah : 0);

  useEffect(() => {
    localStorage.setItem("tajweedEnabled", String(tajweedEnabled));
  }, [tajweedEnabled]);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedSurah]);

  const currentSurah = surahList.find((s) => s.number === selectedSurah);

  // Split ayahs into pages of LINES_PER_PAGE
  const pages = useMemo(() => {
    if (!data) return [];
    const ayahs = data.arabic.ayahs;
    const result: typeof ayahs[] = [];
    for (let i = 0; i < ayahs.length; i += LINES_PER_PAGE) {
      result.push(ayahs.slice(i, i + LINES_PER_PAGE));
    }
    return result;
  }, [data]);

  const totalPages = pages.length;

  // Category Grid View
  if (activeSection === null) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground py-3 md:py-4">
          <div className="container flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Link to="/" className="hover:opacity-80">
                <ArrowLeft className="w-5 h-5" />
              </Link>
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

  // Mushaf-style Reading View
  if (activeSection === "reading") {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground py-3">
          <div className="container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveSection(null)} className="hover:opacity-80">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base md:text-lg font-bold">{t("কুরআন তেলাওয়াত", "Quran Reading", "تلاوة القرآن")}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTajweedEnabled(!tajweedEnabled)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    tajweedEnabled
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/60 hover:text-primary-foreground"
                  }`}
                  title={t("তাজবীদ কালার", "Tajweed Colors", "ألوان التجويد")}
                >
                  <Palette className="w-4 h-4" />
                </button>
                <Select value={String(selectedSurah)} onValueChange={(v) => setSelectedSurah(Number(v))}>
                  <SelectTrigger className="w-auto min-w-[100px] md:min-w-[140px] h-7 md:h-8 text-xs bg-primary-foreground/10 border-none text-primary-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {surahList.map((s) => (
                      <SelectItem key={s.number} value={String(s.number)} className="text-xs">
                        {s.number}. {language === "bn" ? s.bengaliName : s.englishName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        <div className="container py-4 max-w-2xl mx-auto">
          {/* Surah header */}
          {currentSurah && currentPage === 0 && (
            <div className="bg-primary/5 rounded-xl p-4 md:p-5 mb-4 text-center space-y-2">
              <h2 className="font-arabic text-2xl md:text-3xl text-primary">{currentSurah.name}</h2>
              <p className="text-foreground font-semibold text-sm">
                {language === "bn" ? currentSurah.bengaliName : currentSurah.englishName}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
                <span className={`px-2.5 py-1 rounded-full font-medium ${
                  currentSurah.revelationType === "Meccan"
                    ? "bg-accent/15 text-accent"
                    : "bg-primary/15 text-primary"
                }`}>
                  {currentSurah.revelationType === "Meccan"
                    ? t("মক্কী", "Meccan", "مكية")
                    : t("মাদানী", "Medinan", "مدنية")}
                </span>
                <span className="text-muted-foreground">
                  {currentSurah.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}
                </span>
              </div>
              {currentSurah.number !== 9 && (
                <div className="pt-2">
                  <p className="font-arabic text-xl md:text-2xl text-primary/80 leading-relaxed">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tajweed legend */}
          {tajweedEnabled && <div className="mb-4"><TajweedLegend /></div>}

          {/* Mushaf content */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(LINES_PER_PAGE)].map((_, i) => (
                <Skeleton key={i} className="h-8 rounded" />
              ))}
            </div>
          ) : pages.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 md:p-6">
              <div className="space-y-1" dir="rtl">
                {pages[currentPage]?.map((ayah) => (
                  <div key={ayah.number} className="flex items-baseline gap-2 py-1.5 border-b border-border/30 last:border-b-0">
                    <span className="text-[10px] text-muted-foreground font-bold min-w-[20px] text-center shrink-0 font-sans" dir="ltr">
                      {ayah.numberInSurah}
                    </span>
                    <TajweedText
                      text={ayah.text}
                      enabled={tajweedEnabled}
                      className="font-arabic text-lg md:text-xl lg:text-2xl leading-[2.2] text-foreground flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Page navigation */}
          <div className="flex items-center justify-between mt-4 mb-2 gap-2">
            <button
              onClick={() => {
                if (currentPage > 0) {
                  setCurrentPage(currentPage - 1);
                } else if (selectedSurah > 1) {
                  setSelectedSurah(selectedSurah - 1);
                  // Will go to last page after data loads
                  setCurrentPage(999); // Will be clamped
                }
              }}
              disabled={currentPage === 0 && selectedSurah <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("আগের", "Previous", "السابقة")}
            </button>
            <span className="text-xs text-muted-foreground">
              {t(
                `পৃষ্ঠা ${currentPage + 1} / ${totalPages || 1}`,
                `Page ${currentPage + 1} / ${totalPages || 1}`,
                `صفحة ${currentPage + 1} / ${totalPages || 1}`
              )}
            </span>
            <button
              onClick={() => {
                if (currentPage < totalPages - 1) {
                  setCurrentPage(currentPage + 1);
                } else if (selectedSurah < 114) {
                  setSelectedSurah(selectedSurah + 1);
                  setCurrentPage(0);
                }
              }}
              disabled={currentPage >= totalPages - 1 && selectedSurah >= 114}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              {t("পরের", "Next", "التالية")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Surah nav */}
          <div className="flex items-center justify-between mt-2 mb-4 gap-2">
            <button
              onClick={() => { if (selectedSurah > 1) { setSelectedSurah(selectedSurah - 1); } }}
              disabled={selectedSurah <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-3 h-3" />
              {selectedSurah > 1 && (language === "bn" ? surahList[selectedSurah - 2]?.bengaliName : surahList[selectedSurah - 2]?.englishName)}
            </button>
            <span className="text-xs text-muted-foreground">{selectedSurah} / 114</span>
            <button
              onClick={() => { if (selectedSurah < 114) { setSelectedSurah(selectedSurah + 1); } }}
              disabled={selectedSurah >= 114}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              {selectedSurah < 114 && (language === "bn" ? surahList[selectedSurah]?.bengaliName : surahList[selectedSurah]?.englishName)}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Placeholder for other sections
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3">
        <div className="container flex items-center gap-2">
          <button onClick={() => setActiveSection(null)} className="hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">{t("শীঘ্রই আসছে", "Coming Soon", "قريباً")}</h1>
        </div>
      </header>
      <div className="container py-12 text-center text-muted-foreground">
        {t("এই ফিচারটি শীঘ্রই আসছে", "This feature is coming soon", "هذه الميزة قادمة قريباً")}
      </div>
    </div>
  );
}
