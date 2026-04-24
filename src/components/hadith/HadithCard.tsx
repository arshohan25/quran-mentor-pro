import { Card } from "@/components/ui/card";
import { ApiHadith } from "@/hooks/useHadithApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

export default function HadithCard({ hadith, collectionName }: { hadith: ApiHadith; collectionName?: string }) {
  const { t, language } = useLanguage();

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
    </Card>
  );
}
