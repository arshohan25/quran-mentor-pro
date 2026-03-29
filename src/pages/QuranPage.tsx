import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function QuranPage() {
  const { t, language } = useLanguage();
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(true);

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);

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
          <LanguageSwitcher />
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

          {isLoading ? (
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
                      <p className="font-arabic text-2xl leading-loose text-foreground flex-1 text-right">
                        {ayah.text}
                      </p>
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
