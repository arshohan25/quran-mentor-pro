import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { HADITH_COLLECTIONS } from "@/data/hadithCollections";
import { useHadithChapters } from "@/hooks/useHadithApi";
import { Card } from "@/components/ui/card";

export default function HadithCollectionPage() {
  const { collection } = useParams();
  const { t, language } = useLanguage();
  const meta = HADITH_COLLECTIONS.find((c) => c.id === collection);
  const { data: chapters, isLoading, error } = useHadithChapters(collection || "");

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        {t("সংকলন পাওয়া যায়নি", "Collection not found")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="islamic-header">
        <div className="container flex items-center gap-3 relative z-10">
          <Link to="/hadith" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              {language === "bn" ? meta.bnName : language === "ar" ? meta.arName : meta.enName}
            </h1>
            <p className="text-primary-foreground/50 text-[10px]">
              {chapters?.length || 0} {t("অধ্যায়", "chapters")}
            </p>
          </div>
        </div>
      </header>

      <main className="container py-4 max-w-2xl mx-auto space-y-2">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <p className="text-center text-sm text-destructive py-6">
            {t("অধ্যায় লোড করা যায়নি", "Failed to load chapters")}
          </p>
        )}
        {chapters?.map((ch) => (
          <Link key={ch.id} to={`/hadith/${collection}/${ch.chapterNumber}`}>
            <Card className="p-3 hover:border-primary/40 transition-colors flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {ch.chapterNumber}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{ch.chapterEnglish}</p>
                <p className="text-[11px] text-muted-foreground">
                  {ch.hadithCount} {t("হাদীস", "hadith")}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </main>
    </div>
  );
}
