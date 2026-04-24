import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookText } from "lucide-react";
import TafsirCompareContent from "@/components/quran/TafsirCompareContent";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TafsirComparePage() {
  const { t } = useLanguage();
  const { surah, ayah } = useParams<{ surah: string; ayah: string }>();
  const s = Number(surah);
  const a = Number(ayah);

  if (!s || !a) {
    return (
      <div className="container py-12 text-center text-sm text-muted-foreground">
        {t("ভুল আয়াত রেফারেন্স", "Invalid ayah reference")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-3 flex items-center gap-2">
          <Link to={`/quran`} className="p-2 -ml-2 rounded hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-semibold flex items-center gap-2">
            <BookText className="w-4 h-4 text-primary" />
            {t("তাফসির তুলনা", "Tafsir Comparison")}
            <span className="text-xs font-normal text-muted-foreground">· {s}:{a}</span>
          </h1>
        </div>
      </header>
      <div className="container py-4 pb-20">
        <TafsirCompareContent surah={s} ayah={a} enabled={true} />
      </div>
    </div>
  );
}
