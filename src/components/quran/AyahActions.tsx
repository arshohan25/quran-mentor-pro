import { Copy, Share2, Check, Play, Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  arabicText: string;
  translation?: string;
  surahName?: string;
  surahNumber: number;
  ayahNumber: number;
  onPlayAudio?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export default function AyahActions({
  arabicText, translation, surahName, surahNumber, ayahNumber,
  onPlayAudio, onBookmark, isBookmarked
}: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const getShareText = () => {
    let text = `${arabicText}\n\n`;
    if (translation) text += `${translation}\n\n`;
    text += `— ${surahName || "Surah"} ${surahNumber}:${ayahNumber}`;
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      toast.success(t("কপি হয়েছে", "Copied!", "تم النسخ"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("কপি করা যায়নি", "Copy failed", "فشل النسخ"));
    }
  };

  const handleShare = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${surahName} ${surahNumber}:${ayahNumber}`, text });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground mr-1">
          {surahNumber}:{ayahNumber}
        </span>
        {onPlayAudio && (
          <button onClick={onPlayAudio} className="p-1.5 rounded-full hover:bg-accent/10 transition-colors" title={t("চালান", "Play", "تشغيل")}>
            <Play className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
        {onBookmark && (
          <button onClick={onBookmark} className="p-1.5 rounded-full hover:bg-accent/10 transition-colors" title={t("বুকমার্ক", "Bookmark", "إشارة")}>
            {isBookmarked
              ? <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
              : <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
            }
          </button>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        <button onClick={handleCopy} className="p-1.5 rounded-full hover:bg-accent/10 transition-colors" title={t("কপি", "Copy", "نسخ")}>
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
        <button onClick={handleShare} className="p-1.5 rounded-full hover:bg-accent/10 transition-colors" title={t("শেয়ার", "Share", "مشاركة")}>
          <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
