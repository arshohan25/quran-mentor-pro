import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, ChevronRight, BookMarked, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { HADITH_COLLECTIONS } from "@/data/hadithCollections";
import { useHadithSearch } from "@/hooks/useHadithApi";
import HadithCard from "@/components/hadith/HadithCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function HadithPage() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const { data: searchResults, isLoading: searching } = useHadithSearch(query);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="islamic-header">
        <div className="container flex items-center gap-3 relative z-10">
          <Link to="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">{t("হাদীস লাইব্রেরি", "Hadith Library", "مكتبة الحديث")}</h1>
            <p className="text-primary-foreground/50 text-[10px]">
              {t("সিহাহ সিত্তাহ — বাংলা অনুবাদসহ", "Sahih Sittah — with Bengali")}
            </p>
          </div>
        </div>
      </header>

      <main className="container py-4 max-w-2xl mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("বাংলায় হাদীস সার্চ করুন…", "Search hadith in Bengali…")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {query.trim().length >= 2 ? (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {t("সার্চ ফলাফল", "Search Results")}
              {searchResults && ` (${searchResults.length})`}
            </h2>
            {searching && (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
            {searchResults && searchResults.length === 0 && !searching && (
              <p className="text-center text-sm text-muted-foreground py-6">
                {t("কোনো ফলাফল পাওয়া যায়নি", "No results found")}
              </p>
            )}
            {searchResults?.map((h) => (
              <HadithCard key={h.id} hadith={h} />
            ))}
          </div>
        ) : (
          <>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {t("সিহাহ সিত্তাহ", "The Six Books")}
            </h2>
            <div className="grid gap-2">
              {HADITH_COLLECTIONS.map((c) => (
                <Link
                  key={c.id}
                  to={`/hadith/${c.id}`}
                  className="block"
                >
                  <Card className="p-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BookMarked className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {language === "bn" ? c.bnName : language === "ar" ? c.arName : c.enName}
                          </h3>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          {c.description}
                        </p>
                        <p className="text-[10px] text-primary/70 mt-1 font-semibold">
                          {c.totalHadith.toLocaleString()} {t("হাদীস", "hadith")}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
