import { useState } from "react";
import { ChevronDown, BookText, Loader2 } from "lucide-react";
import { useTafsir, TAFSIR_EDITIONS } from "@/hooks/useTafsir";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  surah: number;
  ayah: number;
  tafsirId: number;
}

export default function TafsirAccordion({ surah, ayah, tafsirId }: Props) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useTafsir(surah, ayah, tafsirId, open);

  const edition = TAFSIR_EDITIONS.find((e) => e.id === tafsirId);
  const editionLabel = edition ? (language === "bn" ? edition.bnLabel : edition.enLabel) : "";

  return (
    <div className="border-t border-border/40 pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left group"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-primary/80">
          <BookText className="w-3 h-3" />
          {t("তাফসির", "Tafsir", "تفسير")}
          {editionLabel && <span className="text-[10px] text-muted-foreground font-normal">· {editionLabel}</span>}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {isLoading && (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t("লোড হচ্ছে…", "Loading…")}
            </div>
          )}
          {error && (
            <p className="text-destructive py-1">
              {t("তাফসির আনা যায়নি — পরে আবার চেষ্টা করুন।", "Couldn't load tafsir — try again later.")}
            </p>
          )}
          {data && (
            <p className="whitespace-pre-wrap">
              {data || t("এই আয়াতের জন্য তাফসির পাওয়া যায়নি।", "No tafsir available for this ayah.")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
