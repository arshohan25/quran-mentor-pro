import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ApiHadith } from "@/hooks/useHadithApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, AlertCircle, Copy, Mic } from "lucide-react";
import { toast } from "sonner";
import HadithPracticeDialog from "./HadithPracticeDialog";
import { saveLastHadithSession } from "@/lib/hadithLastSession";

export default function HadithCard({
  hadith,
  collectionName,
  defaultPracticeOpen = false,
}: {
  hadith: ApiHadith;
  collectionName?: string;
  defaultPracticeOpen?: boolean;
}) {
  const { t, language } = useLanguage();
  const { collection, chapter } = useParams();
  const [practiceOpen, setPracticeOpen] = useState(defaultPracticeOpen);
  useEffect(() => {
    if (defaultPracticeOpen) setPracticeOpen(true);
  }, [defaultPracticeOpen]);

  // When practice opens for this hadith, remember it as the resume target.
  useEffect(() => {
    if (practiceOpen && collection && chapter) {
      saveLastHadithSession({
        collection,
        chapter,
        hadithId: hadith.id,
        hadithNumber: hadith.hadithNumber,
      });
    }
  }, [practiceOpen, collection, chapter, hadith.id, hadith.hadithNumber]);

  const text = hadith.hadithBengali || hadith.hadithEnglish || "";
  const grade = (hadith.status || "").toLowerCase();
  const gradeColor = grade.includes("sahih") || grade.includes("সহীহ")
    ? "text-success bg-success/10"
    : grade.includes("hasan") || grade.includes("হাসান")
    ? "text-accent bg-accent/10"
    : "text-muted-foreground bg-muted";

  const copy = () => {
    navigator.clipboard.writeText(`${text}\n— ${collectionName || ""} #${hadith.hadithNumber}`);
    toast.success(t("কপি করা হয়েছে", "Copied"));
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          #{hadith.hadithNumber}
        </span>
        <div className="flex items-center gap-2">
          {hadith.status && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${gradeColor}`}>
              {grade.includes("sahih") ? <CheckCircle2 className="w-3 h-3 inline mr-0.5" /> : <AlertCircle className="w-3 h-3 inline mr-0.5" />}
              {hadith.status}
            </span>
          )}
          <button
            onClick={() => setPracticeOpen(true)}
            className="p-1 hover:bg-muted rounded"
            aria-label={t("অনুশীলন", "Practice")}
            title={t("অনুশীলন", "Practice")}
          >
            <Mic className="w-3.5 h-3.5 text-primary" />
          </button>
          <button onClick={copy} className="p-1 hover:bg-muted rounded">
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
      {hadith.hadithArabic && (
        <p className="font-arabic text-base leading-[2.2] text-foreground" dir="rtl">
          {hadith.hadithArabic}
        </p>
      )}
      {text && (
        <p className="text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-2">
          {text}
        </p>
      )}
      {hadith.englishNarrator && language !== "bn" && (
        <p className="text-[11px] text-muted-foreground/70 italic">— {hadith.englishNarrator}</p>
      )}
      <HadithPracticeDialog open={practiceOpen} onOpenChange={setPracticeOpen} hadith={hadith} />
    </Card>
  );
}
