import { useState } from "react";
import { Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { useTafsirCompare } from "@/hooks/useTafsirCompare";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";

interface Props {
  surah: number;
  ayah: number;
  /** When false, queries are not started — used inside collapsed sheets/dialogs */
  enabled?: boolean;
}

const ACCENTS = [
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-sky-500",
  "border-l-violet-500",
];

/**
 * Inner content for a Tafsir comparison view. Used by both the bottom sheet
 * and the standalone /tafsir/:surah/:ayah page.
 */
export default function TafsirCompareContent({ surah, ayah, enabled = true }: Props) {
  const { t, language } = useLanguage();
  const items = useTafsirCompare(surah, ayah, enabled);
  const { data: surahData } = useSurahWithTranslations(surah);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const ayahData = surahData?.arabic.ayahs.find(a => a.numberInSurah === ayah);
  const ayahBn = surahData?.bengali.ayahs.find(a => a.numberInSurah === ayah);

  const copy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  return (
    <div className="space-y-3">
      {ayahData && (
        <div className="rounded-lg bg-muted/40 p-3 space-y-2">
          <p className="font-arabic text-lg md:text-xl leading-loose text-right" dir="rtl">
            {ayahData.text}
          </p>
          {ayahBn?.text && (
            <p className="text-xs font-bengali text-muted-foreground leading-relaxed">
              {ayahBn.text}
            </p>
          )}
        </div>
      )}

      {items.map((item, i) => {
        const label = language === "bn" ? item.edition.bnLabel : item.edition.enLabel;
        return (
          <article
            key={item.edition.id}
            className={`rounded-lg border border-border bg-card p-3 border-l-4 ${ACCENTS[i % ACCENTS.length]}`}
          >
            <header className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold leading-tight">{label}</h3>
              {item.text && !item.isLoading && (
                <button
                  onClick={() => copy(item.edition.id, item.text)}
                  className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted"
                >
                  {copiedId === item.edition.id ? (
                    <><Check className="w-3 h-3" /> {t("কপি হয়েছে", "Copied")}</>
                  ) : (
                    <><Copy className="w-3 h-3" /> {t("কপি", "Copy")}</>
                  )}
                </button>
              )}
            </header>

            {item.isLoading && (
              <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t("লোড হচ্ছে…", "Loading…")}
              </div>
            )}

            {!!item.error && !item.isLoading && (
              <p className="text-xs text-destructive flex items-center gap-1.5 py-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {t("আনা যায়নি", "Couldn't load")}
              </p>
            )}

            {!item.isLoading && !item.error && (
              <p className="text-xs leading-relaxed font-bengali text-foreground/90 whitespace-pre-wrap">
                {item.text || t("এই আয়াতের জন্য কোনো তাফসির পাওয়া যায়নি।", "No tafsir available for this ayah.")}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
