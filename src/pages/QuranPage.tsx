import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Palette, AlignLeft, LayoutGrid, BookOpen } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useSurahWithTranslations, useWordByWord, useSurahAudio } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import TajweedText, { TajweedLegend } from "@/components/TajweedText";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import HifzMode from "@/components/HifzMode";
import AyahAudioPlayer from "@/components/AyahAudioPlayer";

export default function QuranPage() {
  const { t, language } = useLanguage();
  const { saveLastRead } = useBookmark();
  const [searchParams] = useSearchParams();
  const [selectedSurah, setSelectedSurah] = useState(() => {
    const s = searchParams.get("surah");
    return s ? Number(s) : 1;
  });
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(!searchParams.get("surah"));
  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("tajweedEnabled") !== "false"; } catch { return true; }
  });
  const [viewMode, setViewMode] = useState<"verse" | "word" | "hifz">(() => {
    try { return (localStorage.getItem("quranViewMode") as "verse" | "word" | "hifz") || "verse"; } catch { return "verse"; }
  });

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);
  const wordLang = language === "bn" ? "bn" : language === "ar" ? "ar" : "en";
  const { data: wordData, isLoading: wordLoading } = useWordByWord(selectedSurah, wordLang);

  useEffect(() => {
    saveLastRead(selectedSurah, 1);
  }, [selectedSurah, saveLastRead]);

  useEffect(() => {
    localStorage.setItem("tajweedEnabled", String(tajweedEnabled));
  }, [tajweedEnabled]);

  useEffect(() => {
    localStorage.setItem("quranViewMode", viewMode);
  }, [viewMode]);

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
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">{t("কুরআন পড়ুন", "Read Quran", "اقرأ القرآن")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as "verse" | "word" | "hifz")}
              className="bg-primary-foreground/10 rounded-lg p-0.5"
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
              onClick={() => setTajweedEnabled(!tajweedEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                tajweedEnabled
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "text-primary-foreground/60 hover:text-primary-foreground"
              }`}
              title={t("তাজবীদ কালার", "Tajweed Colors", "ألوان التجويد")}
            >
              <Palette className="w-5 h-5" />
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="container py-4 flex flex-col md:flex-row gap-4">
        {/* Surah list sidebar */}
        <div className={`${showList ? "block" : "hidden md:block"} md:w-80 shrink-0`}>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("সূরা খুঁজুন...", "Search Surah...", "ابحث عن سورة...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[calc(100vh-200px)] rounded-lg border border-border">
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
            <div className="bg-primary/5 rounded-xl p-4 mb-4 text-center">
              <h2 className="font-arabic text-3xl text-primary mb-1">{currentSurah.name}</h2>
              <p className="text-foreground font-semibold">
                {language === "bn" ? currentSurah.bengaliName : currentSurah.englishName}
              </p>
              <p className="text-muted-foreground text-sm">
                {currentSurah.englishNameTranslation} • {currentSurah.numberOfAyahs}{" "}
                {t("আয়াত", "Ayahs", "آيات")}
              </p>
            </div>
          )}

          {/* Tajweed legend */}
          {tajweedEnabled && <div className="mb-4"><TajweedLegend /></div>}

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
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-4">
                  {data.arabic.ayahs.map((ayah, idx) => (
                    <div key={ayah.number} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {ayah.numberInSurah}
                        </span>
                        <TajweedText
                          text={ayah.text}
                          enabled={tajweedEnabled}
                          className="font-arabic text-2xl leading-loose text-foreground flex-1 text-right"
                        />
                      </div>
                      <div className="border-t border-border pt-3 space-y-2 pl-11">
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
                  ))}
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
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-4">
                  {wordData.map((verse) => (
                    <div key={verse.verse_key} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {verse.verse_number}
                        </span>
                        <div className="flex-1 flex flex-wrap-reverse gap-2 justify-end" dir="rtl">
                          {verse.words.map((word) => (
                            <div
                              key={word.id}
                              className="flex flex-col items-center px-2 py-1.5 rounded-lg bg-muted/50 hover:bg-primary/10 transition-colors min-w-[60px]"
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
        </div>
      </div>
    </div>
  );
}
