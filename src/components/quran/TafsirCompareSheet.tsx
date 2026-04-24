import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BookText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import TafsirCompareContent from "./TafsirCompareContent";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surah: number;
  ayah: number;
}

export default function TafsirCompareSheet({ open, onOpenChange, surah, ayah }: Props) {
  const { t } = useLanguage();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <BookText className="w-4 h-4 text-primary" />
              {t("তাফসির তুলনা", "Tafsir Comparison", "مقارنة التفاسير")}
              <span className="text-xs font-normal text-muted-foreground">· {surah}:{ayah}</span>
            </span>
            <Link
              to={`/tafsir/${surah}/${ayah}`}
              onClick={() => onOpenChange(false)}
              className="text-[11px] font-normal text-muted-foreground hover:text-foreground flex items-center gap-1 mr-6"
            >
              <ExternalLink className="w-3 h-3" />
              {t("পূর্ণ পৃষ্ঠা", "Open page")}
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <TafsirCompareContent surah={surah} ayah={ayah} enabled={open} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
