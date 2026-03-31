import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Search, Palette, AlignLeft, LayoutGrid, BookOpen, Repeat, Heart, ListMusic, SearchX, ChevronLeft, ChevronRight } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HifzMode from "@/components/HifzMode";
import AyahAudioPlayer from "@/components/AyahAudioPlayer";

const QARI_LIST = [
  { id: "ar.alafasy", name: "মিশারি আল-আফাসি", nameEn: "Mishary Al-Afasy", nameAr: "مشاري العفاسي" },
  { id: "ar.abdulbasitmurattal", name: "আব্দুল বাসিত", nameEn: "Abdul Basit", nameAr: "عبد الباسط" },
  { id: "ar.abdurrahmaansudais", name: "সুদাইস", nameEn: "Abdurrahmaan As-Sudais", nameAr: "عبدالرحمن السديس" },
  { id: "ar.husaborek", name: "হুসা বোরেক", nameEn: "Husa Borek", nameAr: "هزاع البلوشي" },
  { id: "ar.maaborek", name: "মা'আকিল", nameEn: "Maaqil", nameAr: "ماعقل" },
  { id: "ar.minshawi", name: "মিনশাওয়ি", nameEn: "Al-Minshawi", nameAr: "المنشاوي" },
  { id: "ar.muhammadayyoub", name: "মুহাম্মদ আইয়ুব", nameEn: "Muhammad Ayyoub", nameAr: "محمد أيوب" },
  { id: "ar.muhammadjibreel", name: "মুহাম্মদ জিবরীল", nameEn: "Muhammad Jibreel", nameAr: "محمد جبريل" },
  { id: "ar.shaatree", name: "আবু বকর শাতরি", nameEn: "Abu Bakr Ash-Shaatree", nameAr: "أبو بكر الشاطري" },
];

export default function QuranPage() {
  const { t, language } = useLanguage();
  const { saveLastRead, toggleFavorite, isFavorite } = useBookmark();
  const [searchParams] = useSearchParams();
  const [selectedSurah, setSelectedSurah] = useState(() => {
    const s = searchParams.get("surah");
    return s ? Number(s) : 1;
  });
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(!searchParams.get("surah"));
  const [browseMode, setBrowseMode] = useState<"surah" | "juz">("surah");
  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("tajweedEnabled") !== "false"; } catch { return true; }
  });
  const [viewMode, setViewMode] = useState<"verse" | "word" | "hifz">(() => {
    try { return (localStorage.getItem("quranViewMode") as "verse" | "word" | "hifz") || "verse"; } catch { return "verse"; }
  });

  const [selectedQari, setSelectedQari] = useState(() => {
    try { return localStorage.getItem("selectedQari") || "ar.alafasy"; } catch { return "ar.alafasy"; }
  });

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);
  const { data: audioData } = useSurahAudio(selectedSurah, selectedQari);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [repeatAyah, setRepeatAyah] = useState<number | null>(null);
  const [loopRange, setLoopRange] = useState<{ start: number; end: number } | null>(null);
  const [showLoopRange, setShowLoopRange] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(() => {
    try { return Number(localStorage.getItem("playbackRate")) || 1; } catch { return 1; }
  });
  const [ayahSearch, setAyahSearch] = useState("");
  const [showAyahSearch, setShowAyahSearch] = useState(false);
  const wordLang = language === "bn" ? "bn" : language === "ar" ? "ar" : "en";
  const { data: wordData, isLoading: wordLoading } = useWordByWord(selectedSurah, wordLang);

  // Filter ayah indices based on search
  const filteredIndices = useMemo(() => {
    if (!ayahSearch.trim() || !data) return data?.arabic.ayahs.map((_: any, i: number) => i) || [];
    const q = ayahSearch.trim().toLowerCase();
    return data.arabic.ayahs
      .map((ayah, idx) => {
        const matchAr = ayah.text.includes(q);
        const matchBn = data.bengali.ayahs[idx]?.text?.toLowerCase().includes(q);
        const matchEn = data.english.ayahs[idx]?.text?.toLowerCase().includes(q);
        const matchNum = ayah.numberInSurah.toString() === q;
        return (matchAr || matchBn || matchEn || matchNum) ? idx : -1;
      })
      .filter((i) => i !== -1);
  }, [ayahSearch, data]);

  useEffect(() => {
    saveLastRead(selectedSurah, 1);
  }, [selectedSurah, saveLastRead]);

  useEffect(() => {
    localStorage.setItem("tajweedEnabled", String(tajweedEnabled));
  }, [tajweedEnabled]);

  useEffect(() => {
    localStorage.setItem("quranViewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("selectedQari", selectedQari);
    setPlayingAyah(null);
  }, [selectedQari]);

  const filtered = surahList.filter(
    (s) =>
      s.name.includes(search) ||
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.bengaliName.includes(search) ||
      s.number.toString() === search
  );

  const currentSurah = surahList.find((s) => s.number === selectedSurah);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3 md:py-4">
        <div className="container">
          {/* Top row: back + title + language */}
          <div className="flex items-center justify-between mb-2 md:mb-0">
            <div className="flex items-center gap-2 md:gap-3">
              <Link to="/" className="hover:opacity-80">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg md:text-xl font-bold">{t("কুরআন পড়ুন", "Read Quran", "اقرأ القرآن")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </div>
          {/* Bottom row: controls - scrollable on mobile */}
          <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as "verse" | "word" | "hifz")}
              className="bg-primary-foreground/10 rounded-lg p-0.5 shrink-0"
            >
              <ToggleGroupItem value="verse" className="data-[state=on]:bg-primary-foreground/20 text-primary-foreground px-2 py-1 text-xs rounded" title={t("আয়াত মোড", "Verse Mode", "وضع الآية")}>
                <AlignLeft className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="word" className="data-[state=on]:bg-primary-foreground/20 text-primary-foreground px-2 py-1 text-xs rounded" title={t("শব্দ মোড", "Word Mode", "وضع الكلمة")}>
                <LayoutGrid className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="hifz" className="data-[state=on]:bg-primary-foreground/20 text-primary-foreground px-2 py-1 text-xs rounded" title={t("হিফজ মোড", "Hifz Mode", "وضع الحفظ")}>
                <BookOpen className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <button
              onClick={() => {
                const rates = [0.5, 0.75, 1, 1.25, 1.5];
                const idx = rates.indexOf(playbackRate);
                const next = rates[(idx + 1) % rates.length];
                setPlaybackRate(next);
                localStorage.setItem("playbackRate", String(next));
              }}
              className="px-2 py-1 rounded-lg text-xs font-bold transition-colors bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 min-w-[40px] shrink-0"
              title={t("গতি", "Speed", "السرعة")}
            >
              {playbackRate}x
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`p-1.5 md:p-2 rounded-lg transition-colors shrink-0 ${
                autoPlay
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "text-primary-foreground/60 hover:text-primary-foreground"
              }`}
              title={t("অটো-প্লে", "Auto-Play", "تشغيل تلقائي")}
            >
              <Repeat className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => setShowLoopRange(!showLoopRange)}
              className={`p-1.5 md:p-2 rounded-lg transition-colors shrink-0 ${
                loopRange
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "text-primary-foreground/60 hover:text-primary-foreground"
              }`}
              title={t("আয়াত রেঞ্জ লুপ", "Ayah Range Loop", "تكرار نطاق الآيات")}
            >
              <ListMusic className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => { setShowAyahSearch(!showAyahSearch); if (showAyahSearch) setAyahSearch(""); }}
              className={`p-1.5 md:p-2 rounded-lg transition-colors shrink-0 ${
                showAyahSearch
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "text-primary-foreground/60 hover:text-primary-foreground"
              }`}
              title={t("আয়াত খুঁজুন", "Search Ayah", "بحث آية")}
            >
              {showAyahSearch ? <SearchX className="w-4 h-4 md:w-5 md:h-5" /> : <Search className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            <button
              onClick={() => setTajweedEnabled(!tajweedEnabled)}
              className={`p-1.5 md:p-2 rounded-lg transition-colors shrink-0 ${
                tajweedEnabled
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "text-primary-foreground/60 hover:text-primary-foreground"
              }`}
              title={t("তাজবীদ কালার", "Tajweed Colors", "ألوان التجويد")}
            >
              <Palette className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <Select value={selectedQari} onValueChange={setSelectedQari}>
              <SelectTrigger className="w-auto min-w-[90px] md:min-w-[120px] h-7 md:h-8 text-xs bg-primary-foreground/10 border-none text-primary-foreground shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QARI_LIST.map((q) => (
                  <SelectItem key={q.id} value={q.id} className="text-xs">
                    {language === "bn" ? q.name : language === "ar" ? q.nameAr : q.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="container py-4 flex flex-col md:flex-row gap-4">
        {/* Surah/Juz list sidebar */}
        <div className={`${showList ? "block" : "hidden md:block"} md:w-80 shrink-0`}>
          <div className="flex mb-3 rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setBrowseMode("surah")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                browseMode === "surah" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("সূরা", "Surah", "سورة")}
            </button>
            <button
              onClick={() => setBrowseMode("juz")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                browseMode === "juz" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("পারা/জুয", "Juz/Para", "جزء")}
            </button>
          </div>

          {browseMode === "surah" ? (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("সূরা খুঁজুন...", "Search Surah...", "ابحث عن سورة...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[calc(100vh-250px)] rounded-lg border border-border">
                {filtered.map((surah) => (
                  <button
                    key={surah.number}
                    onClick={() => {
                      setSelectedSurah(surah.number);
                      setShowList(false);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-border flex items-center gap-3 hover:bg-muted transition-colors ${
                      selectedSurah === surah.number ? "bg-primary/10" : ""
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {surah.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm text-foreground truncate">
                          {language === "bn" ? surah.bengaliName : surah.englishName}
                        </span>
                        <span className="font-arabic text-base text-primary">{surah.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {surah.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}
                      </span>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)] rounded-lg border border-border">
              {juzList.map((juz) => {
                const startSurahInfo = surahList.find(s => s.number === juz.startSurah);
                const endSurahInfo = surahList.find(s => s.number === juz.endSurah);
                const isActive = juz.startSurah <= selectedSurah && selectedSurah <= juz.endSurah;
                return (
                  <button
                    key={juz.number}
                    onClick={() => {
                      setSelectedSurah(juz.startSurah);
                      setShowList(false);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted transition-colors ${
                      isActive ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {juz.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm text-foreground">
                            {t(`পারা ${juz.number}`, `Juz ${juz.number}`, `الجزء ${juz.number}`)}
                          </span>
                          <span className="font-arabic text-sm text-primary">{juz.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {language === "bn" ? startSurahInfo?.bengaliName : startSurahInfo?.englishName}
                          {juz.startSurah !== juz.endSurah && ` → ${language === "bn" ? endSurahInfo?.bengaliName : endSurahInfo?.englishName}`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </ScrollArea>
          )}
        </div>

        {/* Ayah display */}
        <div className={`${!showList ? "block" : "hidden md:block"} flex-1`}>
          <button
            onClick={() => setShowList(true)}
            className="md:hidden mb-3 text-primary text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> {t("সূরা তালিকা", "Surah List", "قائمة السور")}
          </button>

          {currentSurah && (
             <div className="bg-primary/5 rounded-xl p-3 md:p-5 mb-4 text-center space-y-2 md:space-y-3">
              <h2 className="font-arabic text-2xl md:text-3xl text-primary">{currentSurah.name}</h2>
              <p className="text-foreground font-semibold text-sm md:text-base">
                {language === "bn" ? currentSurah.bengaliName : currentSurah.englishName}
              </p>
              <p className="text-muted-foreground text-xs md:text-sm">
                {currentSurah.englishNameTranslation} • {currentSurah.numberOfAyahs}{" "}
                {t("আয়াত", "Ayahs", "آيات")}
              </p>
              <div className="flex items-center justify-center gap-2 md:gap-3 text-xs flex-wrap">
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
                  {t(`নাযিলের ক্রম: ${currentSurah.number}`, `Revelation order: ${currentSurah.number}`, `ترتيب النزول: ${currentSurah.number}`)}
                </span>
              </div>
              {currentSurah.number !== 9 && (
                <div className="pt-2">
                  <p className="font-arabic text-xl md:text-2xl text-primary/80 leading-relaxed">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("পরম করুণাময় অসীম দয়ালু আল্লাহর নামে", "In the name of Allah, the Most Gracious, the Most Merciful", "بسم الله الرحمن الرحيم")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tajweed legend */}
          {tajweedEnabled && <div className="mb-4"><TajweedLegend /></div>}

          {/* Ayah Search Bar */}
          {showAyahSearch && (
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("আয়াতে শব্দ খুঁজুন...", "Search in ayahs...", "ابحث في الآيات...")}
                value={ayahSearch}
                onChange={(e) => setAyahSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
              {ayahSearch && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {filteredIndices.length} {t("ফলাফল", "results", "نتائج")}
                </span>
              )}
            </div>
          )}

          {/* Loop Range Selector */}
          {showLoopRange && currentSurah && (
            <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 p-3 md:p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-accent" />
                  {t("আয়াত রেঞ্জ লুপ", "Ayah Range Loop", "تكرار نطاق الآيات")}
                </h3>
                {loopRange && (
                  <button
                    onClick={() => { setLoopRange(null); setPlayingAyah(null); }}
                    className="text-xs text-destructive hover:underline"
                  >
                    {t("বন্ধ করুন", "Clear", "مسح")}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">{t("শুরু", "From", "من")}</label>
                  <select
                    className="rounded-lg border border-border bg-background text-foreground text-sm px-2 py-1.5"
                    value={loopRange?.start || 1}
                    onChange={(e) => {
                      const start = Number(e.target.value);
                      const end = loopRange?.end || Math.min(start + 4, currentSurah.numberOfAyahs);
                      setLoopRange({ start, end: Math.max(start, end) });
                    }}
                  >
                    {Array.from({ length: currentSurah.numberOfAyahs }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">{t("শেষ", "To", "إلى")}</label>
                  <select
                    className="rounded-lg border border-border bg-background text-foreground text-sm px-2 py-1.5"
                    value={loopRange?.end || Math.min(5, currentSurah.numberOfAyahs)}
                    onChange={(e) => {
                      const end = Number(e.target.value);
                      const start = loopRange?.start || 1;
                      setLoopRange({ start: Math.min(start, end), end });
                    }}
                  >
                    {Array.from({ length: currentSurah.numberOfAyahs }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    const start = loopRange?.start || 1;
                    const end = loopRange?.end || Math.min(5, currentSurah.numberOfAyahs);
                    setLoopRange({ start, end });
                    setPlayingAyah(start);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/80 transition-colors"
                >
                  ▶ {t("প্লে করুন", "Play", "تشغيل")}
                </button>
              </div>
              {loopRange && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t(
                    `আয়াত ${loopRange.start} থেকে ${loopRange.end} পর্যন্ত লুপে চলবে`,
                    `Looping ayah ${loopRange.start} to ${loopRange.end}`,
                    `تكرار الآية ${loopRange.start} إلى ${loopRange.end}`
                  )}
                </p>
              )}
            </div>
          )}

          {viewMode === "hifz" ? (
            isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            ) : data ? (
              <HifzMode
                arabicAyahs={data.arabic.ayahs}
                bengaliAyahs={data.bengali.ayahs}
                englishAyahs={data.english.ayahs}
                surahNumber={selectedSurah}
                tajweedEnabled={tajweedEnabled}
              />
            ) : null
          ) : viewMode === "verse" ? (
            isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : data ? (
              <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-320px)]">
                <div className="space-y-4">
                  {filteredIndices.map((idx) => {
                    const ayah = data.arabic.ayahs[idx];
                    const inLoopRange = loopRange && ayah.numberInSurah >= loopRange.start && ayah.numberInSurah <= loopRange.end;
                    return (
                    <div key={ayah.number} className={`rounded-xl border bg-card p-3 md:p-4 ${inLoopRange ? "border-accent/50 ring-1 ring-accent/20" : "border-border"}`}>
                      <div className="flex items-start gap-2 md:gap-3 mb-3">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {ayah.numberInSurah}
                          </span>
                          <AyahAudioPlayer
                            audioUrl={audioData?.[idx]?.audio}
                            isActive={playingAyah === ayah.numberInSurah}
                            onPlay={() => setPlayingAyah(ayah.numberInSurah)}
                            onStop={() => {
                              // Loop range takes priority
                              if (loopRange && ayah.numberInSurah >= loopRange.start && ayah.numberInSurah <= loopRange.end) {
                                if (ayah.numberInSurah < loopRange.end) {
                                  setPlayingAyah(ayah.numberInSurah + 1);
                                } else {
                                  // End of range, loop back to start
                                  setPlayingAyah(loopRange.start);
                                }
                              } else if (autoPlay && data && idx < data.arabic.ayahs.length - 1) {
                                setPlayingAyah(data.arabic.ayahs[idx + 1].numberInSurah);
                              } else {
                                setPlayingAyah(null);
                              }
                            }}
                            autoPlay={(loopRange ? inLoopRange : autoPlay) && playingAyah === ayah.numberInSurah}
                            playbackRate={playbackRate}
                            repeatMode={repeatAyah === ayah.numberInSurah}
                            onToggleRepeat={() => setRepeatAyah(repeatAyah === ayah.numberInSurah ? null : ayah.numberInSurah)}
                          />
                          <button
                            onClick={() => toggleFavorite(selectedSurah, ayah.numberInSurah, ayah.text)}
                            className="p-1 rounded-full transition-colors hover:bg-primary/10"
                            title={t("বুকমার্ক", "Bookmark", "إشارة مرجعية")}
                          >
                            <Heart
                              className={`w-4 h-4 transition-colors ${
                                isFavorite(selectedSurah, ayah.numberInSurah)
                                  ? "fill-destructive text-destructive"
                                  : "text-muted-foreground hover:text-destructive"
                              }`}
                            />
                          </button>
                        </div>
                        <TajweedText
                          text={ayah.text}
                          enabled={tajweedEnabled}
                          className="font-arabic text-xl md:text-2xl leading-loose text-foreground flex-1 text-right"
                        />
                      </div>
                      <div className="border-t border-border pt-3 space-y-2 pl-0 md:pl-11">
                        <p className="text-sm text-foreground leading-relaxed">
                          <span className="text-xs text-muted-foreground font-semibold">বাংলা: </span>
                          {data.bengali.ayahs[idx]?.text}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          <span className="text-xs font-semibold">English: </span>
                          {data.english.ayahs[idx]?.text}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : null
          ) : (
            /* Word-by-Word Mode */
            wordLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            ) : wordData ? (
              <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-320px)]">
                <div className="space-y-4">
                  {wordData.map((verse) => (
                    <div key={verse.verse_key} className="rounded-xl border border-border bg-card p-3 md:p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {verse.verse_number}
                        </span>
                        <div className="flex-1 flex flex-wrap-reverse gap-2 justify-end" dir="rtl">
                          {verse.words.map((word) => (
                            <div
                              key={word.id}
                              className="flex flex-col items-center px-1.5 md:px-2 py-1 md:py-1.5 rounded-lg bg-muted/50 hover:bg-primary/10 transition-colors min-w-[50px] md:min-w-[60px]"
                            >
                              <span className="font-arabic text-xl text-foreground leading-relaxed">
                                {word.text_uthmani}
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-1 leading-tight text-center" dir="ltr">
                                {word.translation?.text || ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : null
          )}

          {/* Previous/Next Surah Navigation */}
          <div className="flex items-center justify-between mt-6 mb-2">
            <button
              onClick={() => { if (selectedSurah > 1) { setSelectedSurah(selectedSurah - 1); setPlayingAyah(null); setAyahSearch(""); } }}
              disabled={selectedSurah <= 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">
                {selectedSurah > 1 ? (language === "bn" ? surahList[selectedSurah - 2]?.bengaliName : surahList[selectedSurah - 2]?.englishName) : t("আগের", "Previous", "السابقة")}
              </span>
            </button>
            <span className="text-xs text-muted-foreground">
              {selectedSurah} / 114
            </span>
            <button
              onClick={() => { if (selectedSurah < 114) { setSelectedSurah(selectedSurah + 1); setPlayingAyah(null); setAyahSearch(""); } }}
              disabled={selectedSurah >= 114}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium">
                {selectedSurah < 114 ? (language === "bn" ? surahList[selectedSurah]?.bengaliName : surahList[selectedSurah]?.englishName) : t("পরের", "Next", "التالية")}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
