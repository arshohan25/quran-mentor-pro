import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Mic } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { HADITH_COLLECTIONS } from "@/data/hadithCollections";
import { useHadithList } from "@/hooks/useHadithApi";
import HadithCard from "@/components/hadith/HadithCard";
import { Button } from "@/components/ui/button";
import { saveLastHadithSession } from "@/lib/hadithLastSession";

export default function HadithChapterPage() {
  const { collection, chapter } = useParams();
  const [searchParams] = useSearchParams();
  const practiceMode = searchParams.get("practice") === "1";
  const { t, language } = useLanguage();
  const [page, setPage] = useState(1);
  const meta = HADITH_COLLECTIONS.find((c) => c.id === collection);
  const { data, isLoading, error } = useHadithList(collection || "", chapter || "", page);

  // Remember the user's last book + chapter so "Resume" can return here.
  useEffect(() => {
    if (collection && chapter) {
      saveLastHadithSession({ collection, chapter });
    }
  }, [collection, chapter]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="islamic-header">
        <div className="container flex items-center gap-3 relative z-10">
          <Link to={`/hadith/${collection}`} className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">
              {meta && (language === "bn" ? meta.bnName : language === "ar" ? meta.arName : meta.enName)}
            </h1>
            <p className="text-primary-foreground/50 text-[10px]">
              {t("অধ্যায়", "Chapter")} {chapter}
            </p>
          </div>
        </div>
      </header>

      <main className="container py-4 max-w-2xl mx-auto space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <p className="text-center text-sm text-destructive py-6">
            {t("লোড করা যায়নি", "Failed to load")}
          </p>
        )}
        {data?.data.length === 0 && !isLoading && (
          <p className="text-center text-sm text-muted-foreground py-6">
            {t("এই অধ্যায়ে কোনো হাদীস নেই", "No hadith in this chapter")}
          </p>
        )}
        {practiceMode && data && data.data.length > 0 && page === 1 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 flex items-center gap-2 text-xs">
            <Mic className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground">
              {t(
                "অনুশীলন মোড — প্রথম হাদীস স্বয়ংক্রিয়ভাবে খোলা হয়েছে।",
                "Practice mode — first hadith opened automatically."
              )}
            </span>
          </div>
        )}
        {data?.data.map((h, i) => (
          <HadithCard
            key={h.id}
            hadith={h}
            collectionName={meta?.bnName}
            defaultPracticeOpen={practiceMode && page === 1 && i === 0}
          />
        ))}

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between pt-3">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="w-4 h-4 mr-1" /> {t("আগের", "Prev")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {data.current_page} / {data.last_page}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.last_page, p + 1))} disabled={page >= data.last_page}>
              {t("পরের", "Next")} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
