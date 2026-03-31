import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  disablePrev: boolean;
  disableNext: boolean;
}

export default function PageNav({ currentPage, totalPages, onPrev, onNext, disablePrev, disableNext }: Props) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between mt-4 mb-2 gap-2">
      <button
        onClick={onPrev}
        disabled={disablePrev}
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
        onClick={onNext}
        disabled={disableNext}
        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
      >
        {t("পরের", "Next", "التالية")}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
