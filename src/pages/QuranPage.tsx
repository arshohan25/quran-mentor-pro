import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, BookText, Headphones, Languages, GraduationCap, Star, ChevronLeft, ChevronRight, Palette, Search, Play, Pause, SkipForward, SkipBack, Eye, EyeOff, Heart, Trash2, CheckCircle, Circle, BarChart3 } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useSurahWithTranslations, useWordByWord, useSurahAudio } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { juzList } from "@/data/juzData";
import { qariList } from "@/data/prayerData";
import { useBookmark } from "@/hooks/useBookmark";
import { Button } from "@/components/ui/button";
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
  { id: "audio" as const, icon: Headphones, labelBn: "অডিও তেলাওয়াত", labelEn: "Audio Recitation", labelAr: "التلاوة الصوتية", active: true },
  { id: "wordmeaning" as const, icon: Languages, labelBn: "শব্দার্থ", labelEn: "Word Meaning", labelAr: "معاني الكلمات", active: true },
  { id: "hifz" as const, icon: GraduationCap, labelBn: "হিফয", labelEn: "Hifz", labelAr: "الحفظ", active: true },
  { id: "bookmarks" as const, icon: Star, labelBn: "বুকমার্ক", labelEn: "Bookmarks", labelAr: "الإشارات المرجعية", active: true },
];

export default function QuranPage() {
  const { t, language } = useLanguage();
  const { saveLastAudio, bookmarks, toggleFavorite, isFavorite } = useBookmark();
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

  // Audio state
  const [selectedQari, setSelectedQari] = useState(qariList[0].id);
  const [currentAyah, setCurrentAyah] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading } = useSurahWithTranslations(
    ["reading", "translation", "audio", "hifz"].includes(activeSection || "") ? selectedSurah : 0
  );

  // Hifz state
  const [hifzPage, setHifzPage] = useState(0);
  const [showHifzDashboard, setShowHifzDashboard] = useState(false);
  const [hiddenAyahs, setHiddenAyahs] = useState<Set<number>>(new Set());
  const [hifzMode, setHifzMode] = useState<"manual" | "all-hidden">("manual");

  // Hifz progress — persisted per surah in localStorage
  const HIFZ_KEY = "hifz-progress";
  const loadHifzProgress = (): Record<number, number[]> => {
    try { return JSON.parse(localStorage.getItem(HIFZ_KEY) || "{}"); } catch { return {}; }
  };
  const [hifzProgress, setHifzProgress] = useState<Record<number, number[]>>(loadHifzProgress);

  const isMemorized = (surah: number, ayahNum: number) =>
    (hifzProgress[surah] || []).includes(ayahNum);

  const toggleMemorized = (surah: number, ayahNum: number) => {
    setHifzProgress(prev => {
      const list = prev[surah] || [];
      const next = list.includes(ayahNum)
        ? { ...prev, [surah]: list.filter(a => a !== ayahNum) }
        : { ...prev, [surah]: [...list, ayahNum] };
      localStorage.setItem(HIFZ_KEY, JSON.stringify(next));
      return next;
    });
  };

  const markAllMemorized = (surah: number, ayahNums: number[]) => {
    setHifzProgress(prev => {
      const list = prev[surah] || [];
      const allDone = ayahNums.every(a => list.includes(a));
      const next = allDone
        ? { ...prev, [surah]: list.filter(a => !ayahNums.includes(a)) }
        : { ...prev, [surah]: [...new Set([...list, ...ayahNums])] };
      localStorage.setItem(HIFZ_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleHideAyah = (num: number) => {
    setHiddenAyahs(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      return next;
    });
  };

  const hifzPages = useMemo(() => {
    if (!data) return [];
    const ayahs = data.arabic.ayahs;
    const result: typeof ayahs[] = [];
    for (let i = 0; i < ayahs.length; i += LINES_PER_PAGE) {
      result.push(ayahs.slice(i, i + LINES_PER_PAGE));
    }
    return result;
  }, [data]);

  const { data: audioData, isLoading: loadingAudio } = useSurahAudio(
    activeSection === "audio" ? selectedSurah : 0,
    selectedQari
  );

  const { data: wordData, isLoading: wordLoading } = useWordByWord(
    activeSection === "wordmeaning" ? selectedSurah : 0,
    language === "bn" ? "bn" : "en"
  );

  const [wordPage, setWordPage] = useState(0);

  // Translation pages
  const translationPages = useMemo(() => {
    if (!data) return [];
    const ayahs = data.arabic.ayahs;
    const result: number[][] = [];
    for (let i = 0; i < ayahs.length; i += LINES_PER_PAGE) {
      result.push(ayahs.slice(i, i + LINES_PER_PAGE).map((_, idx) => i + idx));
    }
    return result;
  }, [data]);

  const [translationPage, setTranslationPage] = useState(0);

  useEffect(() => {
    setTranslationPage(0);
    setWordPage(0);
    setHifzPage(0);
    setHiddenAyahs(new Set());
  }, [selectedSurah]);

  useEffect(() => {
    localStorage.setItem("tajweedEnabled", String(tajweedEnabled));
  }, [tajweedEnabled]);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedSurah]);

  // Audio playback
  const playAyah = (index: number) => {
    if (!audioData || !audioData[index]) return;
    const audioUrl = (audioData[index] as any).audio;
    if (!audioUrl) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setCurrentAyah(index);
    setIsPlaying(true);
    saveLastAudio(selectedSurah, index + 1, selectedQari);
    audio.play();
    audio.onended = () => {
      if (index < (audioData?.length || 0) - 1) {
        playAyah(index + 1);
      } else {
        setIsPlaying(false);
      }
    };
  };

  const togglePlay = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playAyah(currentAyah);
    }
  };

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

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
                  <div key={ayah.number} className="flex items-center gap-1 py-1.5 border-b border-border/30 last:border-b-0">
                    <button
                      onClick={() => toggleFavorite(selectedSurah, ayah.numberInSurah, ayah.text)}
                      className="p-0.5 shrink-0"
                      dir="ltr"
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavorite(selectedSurah, ayah.numberInSurah) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                    </button>
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

  // Translation & Tafsir View
  if (activeSection === "translation") {
    const totalTransPages = translationPages.length;
    const currentIndices = translationPages[translationPage] || [];
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground py-3">
          <div className="container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveSection(null)} className="hover:opacity-80">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base md:text-lg font-bold">{t("তরজমা ও তাফসির", "Translation & Tafsir", "الترجمة والتفسير")}</h1>
              </div>
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
        </header>

        <div className="container py-4 max-w-2xl mx-auto">
          {/* Surah info */}
          {currentSurah && translationPage === 0 && (
            <div className="bg-primary/5 rounded-xl p-4 mb-4 text-center space-y-1">
              <h2 className="font-arabic text-2xl text-primary">{currentSurah.name}</h2>
              <p className="text-foreground font-semibold text-sm">
                {language === "bn" ? currentSurah.bengaliName : currentSurah.englishName}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className={`px-2.5 py-1 rounded-full font-medium ${
                  currentSurah.revelationType === "Meccan" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
                }`}>
                  {currentSurah.revelationType === "Meccan" ? t("মক্কী", "Meccan", "مكية") : t("মাদানী", "Medinan", "مدنية")}
                </span>
                <span className="text-muted-foreground">{currentSurah.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}</span>
              </div>
            </div>
          )}

          {/* Ayah cards */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : data ? (
            <div className="space-y-3">
              {currentIndices.map((idx) => {
                const arabicAyah = data.arabic.ayahs[idx];
                const bengaliAyah = data.bengali?.ayahs[idx];
                const englishAyah = data.english?.ayahs[idx];
                if (!arabicAyah) return null;
                return (
                  <Card key={arabicAyah.number} className="p-4 space-y-3">
                    {/* Ayah number badge + bookmark */}
                    <div className="flex items-center justify-between">
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                        {arabicAyah.numberInSurah}
                      </span>
                      <button
                        onClick={() => toggleFavorite(selectedSurah, arabicAyah.numberInSurah, arabicAyah.text)}
                        className="p-1 rounded-full hover:bg-accent/10 transition-colors"
                      >
                        <Star className={`w-4 h-4 ${isFavorite(selectedSurah, arabicAyah.numberInSurah) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                    {/* Arabic text */}
                    <p className="font-arabic text-lg md:text-xl leading-[2.2] text-foreground" dir="rtl">
                      {arabicAyah.text}
                    </p>
                    {/* Bengali translation */}
                    {bengaliAyah && (
                      <p className="text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-2">
                        <span className="text-xs font-semibold text-primary/70 block mb-1">{t("বাংলা", "Bengali", "بنغالي")}</span>
                        {bengaliAyah.text}
                      </p>
                    )}
                    {/* English translation */}
                    {englishAyah && (
                      <p className="text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-2">
                        <span className="text-xs font-semibold text-primary/70 block mb-1">{t("ইংরেজি", "English", "إنجليزي")}</span>
                        {englishAyah.text}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : null}

          {/* Page navigation */}
          <div className="flex items-center justify-between mt-4 mb-2 gap-2">
            <button
              onClick={() => translationPage > 0 ? setTranslationPage(translationPage - 1) : selectedSurah > 1 && (setSelectedSurah(selectedSurah - 1), setTranslationPage(999))}
              disabled={translationPage === 0 && selectedSurah <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("আগের", "Previous", "السابقة")}
            </button>
            <span className="text-xs text-muted-foreground">
              {t(
                `পৃষ্ঠা ${translationPage + 1} / ${totalTransPages || 1}`,
                `Page ${translationPage + 1} / ${totalTransPages || 1}`,
                `صفحة ${translationPage + 1} / ${totalTransPages || 1}`
              )}
            </span>
            <button
              onClick={() => translationPage < totalTransPages - 1 ? setTranslationPage(translationPage + 1) : selectedSurah < 114 && (setSelectedSurah(selectedSurah + 1), setTranslationPage(0))}
              disabled={translationPage >= totalTransPages - 1 && selectedSurah >= 114}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              {t("পরের", "Next", "التالية")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Surah nav */}
          <div className="flex items-center justify-between mt-2 mb-4 gap-2">
            <button
              onClick={() => { if (selectedSurah > 1) setSelectedSurah(selectedSurah - 1); }}
              disabled={selectedSurah <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-3 h-3" />
              {selectedSurah > 1 && (language === "bn" ? surahList[selectedSurah - 2]?.bengaliName : surahList[selectedSurah - 2]?.englishName)}
            </button>
            <span className="text-xs text-muted-foreground">{selectedSurah} / 114</span>
            <button
              onClick={() => { if (selectedSurah < 114) setSelectedSurah(selectedSurah + 1); }}
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

  // Word Meaning View
  if (activeSection === "wordmeaning") {
    const VERSES_PER_PAGE = 5;
    const wordPages = wordData ? Math.ceil(wordData.length / VERSES_PER_PAGE) : 0;
    const clampedWordPage = Math.min(wordPage, Math.max(0, wordPages - 1));
    const currentVerses = wordData?.slice(clampedWordPage * VERSES_PER_PAGE, (clampedWordPage + 1) * VERSES_PER_PAGE) || [];

    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground py-3">
          <div className="container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveSection(null)} className="hover:opacity-80">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base md:text-lg font-bold">{t("শব্দার্থ", "Word Meaning", "معاني الكلمات")}</h1>
              </div>
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
        </header>

        <div className="container py-4 max-w-2xl mx-auto">
          {/* Surah info */}
          {currentSurah && clampedWordPage === 0 && (
            <div className="bg-primary/5 rounded-xl p-4 mb-4 text-center space-y-1">
              <h2 className="font-arabic text-2xl text-primary">{currentSurah.name}</h2>
              <p className="text-foreground font-semibold text-sm">
                {language === "bn" ? currentSurah.bengaliName : currentSurah.englishName}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="text-muted-foreground">{currentSurah.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}</span>
              </div>
            </div>
          )}

          {wordLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : currentVerses.length > 0 ? (
            <div className="space-y-4">
              {currentVerses.map((verse) => (
                <Card key={verse.verse_key} className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                      {t(`আয়াত ${verse.verse_number}`, `Ayah ${verse.verse_number}`, `آية ${verse.verse_number}`)}
                    </span>
                  </div>
                  {/* Word grid */}
                  <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
                    {verse.words.map((word) => (
                      <div
                        key={word.id}
                        className="flex flex-col items-center bg-primary/5 rounded-lg px-3 py-2 min-w-[70px] hover:bg-primary/10 transition-colors"
                      >
                        <span className="font-arabic text-lg md:text-xl text-foreground leading-relaxed">
                          {word.text_uthmani}
                        </span>
                        {word.transliteration?.text && (
                          <span className="text-[10px] text-muted-foreground italic mt-0.5">
                            {word.transliteration.text}
                          </span>
                        )}
                        <span className="text-xs text-primary font-medium mt-1 text-center leading-tight">
                          {word.translation?.text || ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          {/* Page navigation */}
          <div className="flex items-center justify-between mt-4 mb-2 gap-2">
            <button
              onClick={() => clampedWordPage > 0 ? setWordPage(clampedWordPage - 1) : selectedSurah > 1 && (setSelectedSurah(selectedSurah - 1), setWordPage(999))}
              disabled={clampedWordPage === 0 && selectedSurah <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("আগের", "Previous", "السابقة")}
            </button>
            <span className="text-xs text-muted-foreground">
              {t(
                `পৃষ্ঠা ${clampedWordPage + 1} / ${wordPages || 1}`,
                `Page ${clampedWordPage + 1} / ${wordPages || 1}`,
                `صفحة ${clampedWordPage + 1} / ${wordPages || 1}`
              )}
            </span>
            <button
              onClick={() => clampedWordPage < wordPages - 1 ? setWordPage(clampedWordPage + 1) : selectedSurah < 114 && (setSelectedSurah(selectedSurah + 1), setWordPage(0))}
              disabled={clampedWordPage >= wordPages - 1 && selectedSurah >= 114}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              {t("পরের", "Next", "التالية")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Surah nav */}
          <div className="flex items-center justify-between mt-2 mb-4 gap-2">
            <button
              onClick={() => { if (selectedSurah > 1) setSelectedSurah(selectedSurah - 1); }}
              disabled={selectedSurah <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-3 h-3" />
              {selectedSurah > 1 && (language === "bn" ? surahList[selectedSurah - 2]?.bengaliName : surahList[selectedSurah - 2]?.englishName)}
            </button>
            <span className="text-xs text-muted-foreground">{selectedSurah} / 114</span>
            <button
              onClick={() => { if (selectedSurah < 114) setSelectedSurah(selectedSurah + 1); }}
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

  // Audio Recitation View
  if (activeSection === "audio") {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground py-3">
          <div className="container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => { setActiveSection(null); if (audioRef.current) audioRef.current.pause(); setIsPlaying(false); }} className="hover:opacity-80">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base md:text-lg font-bold">{t("অডিও তেলাওয়াত", "Audio Recitation", "التلاوة الصوتية")}</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="container py-4 max-w-2xl mx-auto">
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Select value={String(selectedSurah)} onValueChange={(v) => { setSelectedSurah(Number(v)); setCurrentAyah(0); setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); }}>
              <SelectTrigger className="h-9 text-sm">
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
            <Select value={selectedQari} onValueChange={(v) => { setSelectedQari(v); setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {qariList.map((q) => (
                  <SelectItem key={q.id} value={q.id} className="text-xs">
                    {language === "bn" ? q.nameBn : q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Player controls */}
          <div className="bg-primary/5 rounded-xl p-5 mb-4 text-center">
            {currentSurah && (
              <div className="mb-3">
                <h2 className="font-arabic text-2xl text-primary">{currentSurah.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("আয়াত", "Ayah", "آية")} {currentAyah + 1} / {currentSurah.numberOfAyahs}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" disabled={currentAyah === 0} onClick={() => { const prev = currentAyah - 1; setCurrentAyah(prev); if (isPlaying) playAyah(prev); }}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="lg" className="w-14 h-14 rounded-full" onClick={togglePlay} disabled={loadingAudio}>
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </Button>
              <Button variant="outline" size="icon" disabled={currentAyah >= (data?.arabic.ayahs.length || 1) - 1} onClick={() => { const next = currentAyah + 1; setCurrentAyah(next); if (isPlaying) playAyah(next); }}>
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Ayah list */}
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : data ? (
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-2">
                {data.arabic.ayahs.map((ayah, idx) => (
                  <button
                    key={ayah.number}
                    onClick={() => playAyah(idx)}
                    className={`w-full text-left rounded-lg border p-3 transition-all ${
                      currentAyah === idx
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-1 ${
                        currentAyah === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {ayah.numberInSurah}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-arabic text-base md:text-lg leading-relaxed text-right text-foreground" dir="rtl">{ayah.text}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{data.bengali?.ayahs[idx]?.text}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : null}

          {/* Surah nav */}
          <div className="flex items-center justify-between mt-4 mb-4 gap-2">
            <button
              onClick={() => { if (selectedSurah > 1) { setSelectedSurah(selectedSurah - 1); setCurrentAyah(0); setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); } }}
              disabled={selectedSurah <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-3 h-3" />
              {selectedSurah > 1 && (language === "bn" ? surahList[selectedSurah - 2]?.bengaliName : surahList[selectedSurah - 2]?.englishName)}
            </button>
            <span className="text-xs text-muted-foreground">{selectedSurah} / 114</span>
            <button
              onClick={() => { if (selectedSurah < 114) { setSelectedSurah(selectedSurah + 1); setCurrentAyah(0); setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); } }}
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

  // Hifz View
  if (activeSection === "hifz") {
    const totalHifzPages = hifzPages.length;
    const clampedHifzPage = Math.min(hifzPage, Math.max(0, totalHifzPages - 1));
    const currentHifzAyahs = hifzPages[clampedHifzPage] || [];
    const allCurrentHidden = currentHifzAyahs.length > 0 && currentHifzAyahs.every(a => hiddenAyahs.has(a.number));

    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground py-3">
          <div className="container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveSection(null)} className="hover:opacity-80">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base md:text-lg font-bold">{t("হিফয প্র্যাকটিস", "Hifz Practice", "تمرين الحفظ")}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHifzDashboard(!showHifzDashboard)}
                  className={`p-1.5 rounded-lg transition-colors ${showHifzDashboard ? "bg-primary-foreground/20 text-primary-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"}`}
                  title={t("ড্যাশবোর্ড", "Dashboard", "لوحة التحكم")}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                {!showHifzDashboard && (
                  <>
                    <button
                      onClick={() => {
                        if (allCurrentHidden) {
                          setHiddenAyahs(prev => {
                            const next = new Set(prev);
                            currentHifzAyahs.forEach(a => next.delete(a.number));
                            return next;
                          });
                        } else {
                          setHiddenAyahs(prev => {
                            const next = new Set(prev);
                            currentHifzAyahs.forEach(a => next.add(a.number));
                            return next;
                          });
                        }
                      }}
                      className="p-1.5 rounded-lg bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
                      title={allCurrentHidden ? t("সব দেখান", "Show All", "إظهار الكل") : t("সব লুকান", "Hide All", "إخفاء الكل")}
                    >
                      {allCurrentHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="container py-4 max-w-2xl mx-auto">
          {/* Dashboard View */}
          {showHifzDashboard ? (() => {
            const totalMemorized = Object.values(hifzProgress).reduce((sum, arr) => sum + arr.length, 0);
            const totalAyahsAll = surahList.reduce((sum, s) => sum + s.numberOfAyahs, 0);
            const overallPct = totalAyahsAll > 0 ? Math.round((totalMemorized / totalAyahsAll) * 100) : 0;
            const surahsWithProgress = surahList.filter(s => (hifzProgress[s.number] || []).length > 0);
            const completedSurahs = surahList.filter(s => (hifzProgress[s.number] || []).length >= s.numberOfAyahs);

            return (
              <div className="space-y-4">
                {/* Overall stats */}
                <Card className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{t("সামগ্রিক প্রগ্রেস", "Overall Progress", "التقدم العام")}</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-primary/5 rounded-lg p-2">
                      <p className="text-lg font-bold text-primary">{totalMemorized}</p>
                      <p className="text-[10px] text-muted-foreground">{t("আয়াত মুখস্থ", "Ayahs memorized", "آيات محفوظة")}</p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-2">
                      <p className="text-lg font-bold text-primary">{completedSurahs.length}</p>
                      <p className="text-[10px] text-muted-foreground">{t("সূরা সম্পূর্ণ", "Surahs complete", "سور مكتملة")}</p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-2">
                      <p className="text-lg font-bold text-primary">{overallPct}%</p>
                      <p className="text-[10px] text-muted-foreground">{t("সম্পূর্ণ", "Complete", "مكتمل")}</p>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
                  </div>
                </Card>

                {/* Surah-wise progress */}
                <h3 className="text-sm font-semibold text-foreground">{t("সূরা অনুযায়ী প্রগ্রেস", "Progress by Surah", "التقدم حسب السورة")}</h3>
                {surahsWithProgress.length === 0 ? (
                  <div className="text-center py-8">
                    <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{t("এখনও কোন সূরা শুরু হয়নি", "No surahs started yet", "لم تبدأ أي سورة بعد")}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{t("হিফয ভিউতে আয়াত মুখস্থ চিহ্নিত করুন", "Mark ayahs as memorized in Hifz view", "حدد الآيات كمحفوظة في عرض الحفظ")}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    <div className="space-y-2">
                      {surahList.map(s => {
                        const memorized = (hifzProgress[s.number] || []).length;
                        if (memorized === 0) return null;
                        const pct = Math.round((memorized / s.numberOfAyahs) * 100);
                        const isComplete = memorized >= s.numberOfAyahs;
                        return (
                          <button
                            key={s.number}
                            onClick={() => { setSelectedSurah(s.number); setShowHifzDashboard(false); }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left"
                          >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isComplete ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                            }`}>
                              {isComplete ? "✓" : s.number}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {language === "bn" ? s.bengaliName : s.englishName}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">{memorized}/{s.numberOfAyahs}</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${isComplete ? "bg-primary" : "bg-primary/60"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            );
          })() : (
          <>
          {/* Surah info + progress */}
          {currentSurah && (
            <div className="bg-primary/5 rounded-xl p-4 mb-4 text-center space-y-2">
              {clampedHifzPage === 0 && (
                <>
                  <h2 className="font-arabic text-2xl text-primary">{currentSurah.name}</h2>
                  <p className="text-foreground font-semibold text-sm">
                    {language === "bn" ? currentSurah.bengaliName : currentSurah.englishName}
                  </p>
                </>
              )}
              {/* Progress bar */}
              {(() => {
                const memorizedCount = (hifzProgress[selectedSurah] || []).length;
                const totalAyahs = currentSurah.numberOfAyahs;
                const pct = totalAyahs > 0 ? Math.round((memorizedCount / totalAyahs) * 100) : 0;
                return (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {t("মুখস্থ", "Memorized", "محفوظ")}
                      </span>
                      <span className="font-semibold text-primary">{memorizedCount}/{totalAyahs} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {pct === 100 && (
                      <p className="text-xs text-primary font-semibold">
                        {t("🎉 আলহামদুলিল্লাহ! সম্পূর্ণ মুখস্থ!", "🎉 Alhamdulillah! Fully memorized!", "🎉 الحمد لله! تم الحفظ كاملاً!")}
                      </p>
                    )}
                  </div>
                );
              })()}
              <p className="text-[10px] text-muted-foreground">
                {t("ট্যাপ = লুকান/দেখান • ✓ = মুখস্থ চিহ্নিত", "Tap = hide/show • ✓ = mark memorized", "اضغط = إخفاء/إظهار • ✓ = تحديد كمحفوظ")}
              </p>
            </div>
          )}

          {/* Hifz content */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(LINES_PER_PAGE)].map((_, i) => (
                <Skeleton key={i} className="h-8 rounded" />
              ))}
            </div>
          ) : currentHifzAyahs.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 md:p-6">
              <div className="space-y-1" dir="rtl">
                {currentHifzAyahs.map((ayah) => {
                  const isHidden = hiddenAyahs.has(ayah.number);
                  const memorized = isMemorized(selectedSurah, ayah.numberInSurah);
                  return (
                    <div
                      key={ayah.number}
                      className={`flex items-center gap-1 py-1.5 border-b border-border/30 last:border-b-0 rounded transition-all ${
                        memorized ? "bg-primary/8" : ""
                      }`}
                    >
                      {/* Memorize toggle */}
                      <button
                        onClick={() => toggleMemorized(selectedSurah, ayah.numberInSurah)}
                        className="p-0.5 shrink-0"
                        dir="ltr"
                        title={memorized ? t("মুখস্থ বাতিল", "Unmark", "إلغاء") : t("মুখস্থ চিহ্নিত", "Mark memorized", "تحديد")}
                      >
                        {memorized
                          ? <CheckCircle className="w-4 h-4 text-primary" />
                          : <Circle className="w-4 h-4 text-muted-foreground/40" />
                        }
                      </button>
                      {/* Ayah text (tap to hide/show) */}
                      <button
                        onClick={() => toggleHideAyah(ayah.number)}
                        className={`flex-1 flex items-baseline gap-2 py-0.5 px-1 text-right rounded transition-all ${
                          isHidden ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-[10px] text-muted-foreground font-bold min-w-[20px] text-center shrink-0 font-sans" dir="ltr">
                          {ayah.numberInSurah}
                        </span>
                        <span className={`font-arabic text-lg md:text-xl lg:text-2xl leading-[2.2] flex-1 transition-all ${
                          isHidden ? "blur-md select-none text-muted-foreground" : "text-foreground"
                        }`}>
                          {ayah.text}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Mark all on page */}
              <div className="mt-3 text-center">
                <button
                  onClick={() => markAllMemorized(selectedSurah, currentHifzAyahs.map(a => a.numberInSurah))}
                  className="text-xs text-primary hover:underline"
                >
                  {currentHifzAyahs.every(a => isMemorized(selectedSurah, a.numberInSurah))
                    ? t("এই পৃষ্ঠা আনমার্ক করুন", "Unmark this page", "إلغاء تحديد الصفحة")
                    : t("এই পৃষ্ঠা মুখস্থ চিহ্নিত করুন", "Mark this page as memorized", "تحديد الصفحة كمحفوظة")
                  }
                </button>
              </div>
            </div>
          ) : null}

          {/* Page navigation */}
          <div className="flex items-center justify-between mt-4 mb-2 gap-2">
            <button
              onClick={() => clampedHifzPage > 0 ? setHifzPage(clampedHifzPage - 1) : selectedSurah > 1 && (setSelectedSurah(selectedSurah - 1), setHifzPage(999))}
              disabled={clampedHifzPage === 0 && selectedSurah <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("আগের", "Previous", "السابقة")}
            </button>
            <span className="text-xs text-muted-foreground">
              {t(
                `পৃষ্ঠা ${clampedHifzPage + 1} / ${totalHifzPages || 1}`,
                `Page ${clampedHifzPage + 1} / ${totalHifzPages || 1}`,
                `صفحة ${clampedHifzPage + 1} / ${totalHifzPages || 1}`
              )}
            </span>
            <button
              onClick={() => clampedHifzPage < totalHifzPages - 1 ? setHifzPage(clampedHifzPage + 1) : selectedSurah < 114 && (setSelectedSurah(selectedSurah + 1), setHifzPage(0))}
              disabled={clampedHifzPage >= totalHifzPages - 1 && selectedSurah >= 114}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              {t("পরের", "Next", "التالية")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Surah nav */}
          <div className="flex items-center justify-between mt-2 mb-4 gap-2">
            <button
              onClick={() => { if (selectedSurah > 1) setSelectedSurah(selectedSurah - 1); }}
              disabled={selectedSurah <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-3 h-3" />
              {selectedSurah > 1 && (language === "bn" ? surahList[selectedSurah - 2]?.bengaliName : surahList[selectedSurah - 2]?.englishName)}
            </button>
            <span className="text-xs text-muted-foreground">{selectedSurah} / 114</span>
            <button
              onClick={() => { if (selectedSurah < 114) setSelectedSurah(selectedSurah + 1); }}
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

  // Bookmarks View
  if (activeSection === "bookmarks") {
    const favorites = bookmarks.favorites || [];
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground py-3">
          <div className="container">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveSection(null)} className="hover:opacity-80">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base md:text-lg font-bold">{t("বুকমার্ক", "Bookmarks", "الإشارات المرجعية")}</h1>
            </div>
          </div>
        </header>

        <div className="container py-4 max-w-2xl mx-auto">
          {favorites.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Star className="w-12 h-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {t("কোন বুকমার্ক নেই", "No bookmarks yet", "لا توجد إشارات مرجعية")}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {t(
                  "তরজমা ভিউতে আয়াতের পাশে ⭐ চাপুন",
                  "Tap ⭐ next to an ayah in Translation view",
                  "اضغط ⭐ بجانب الآية في عرض الترجمة"
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-2">
                {t(`${favorites.length} টি বুকমার্ক`, `${favorites.length} bookmarks`, `${favorites.length} إشارات`)}
              </p>
              {favorites.map((fav) => {
                const surah = surahList.find(s => s.number === fav.surah);
                return (
                  <Card key={`${fav.surah}-${fav.ayah}`} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                          {surah ? (language === "bn" ? surah.bengaliName : surah.englishName) : fav.surah}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t(`আয়াত ${fav.ayah}`, `Ayah ${fav.ayah}`, `آية ${fav.ayah}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedSurah(fav.surah);
                            setActiveSection("reading");
                          }}
                          className="p-1.5 rounded-full hover:bg-primary/10 transition-colors text-primary"
                          title={t("পড়ুন", "Read", "اقرأ")}
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFavorite(fav.surah, fav.ayah)}
                          className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors text-destructive"
                          title={t("মুছুন", "Remove", "حذف")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {fav.text && (
                      <p className="font-arabic text-base leading-[2] text-foreground/80" dir="rtl">
                        {fav.text}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
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
