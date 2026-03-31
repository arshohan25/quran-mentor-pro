import { ArrowLeft, Star, BookOpen, Trash2 } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { Card } from "@/components/ui/card";
import { type QuranSectionProps } from "./types";

interface BookmarksViewProps extends QuranSectionProps {
  onNavigateToReading: (surah: number) => void;
}

export default function BookmarksView({ selectedSurah, setSelectedSurah, onBack, onNavigateToReading }: BookmarksViewProps) {
  const { t, language } = useLanguage();
  const { bookmarks, toggleFavorite } = useBookmark();
  const favorites = bookmarks.favorites || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3">
        <div className="container">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-base md:text-lg font-bold">{t("বুকমার্ক", "Bookmarks", "الإشارات المرجعية")}</h1>
          </div>
        </div>
      </header>

      <div className="container py-4 max-w-2xl mx-auto">
        {favorites.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Star className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">{t("কোন বুকমার্ক নেই", "No bookmarks yet", "لا توجد إشارات مرجعية")}</p>
            <p className="text-xs text-muted-foreground/70">{t("তরজমা ভিউতে আয়াতের পাশে ⭐ চাপুন", "Tap ⭐ next to an ayah in Translation view", "اضغط ⭐ بجانب الآية في عرض الترجمة")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center mb-2">
              {t(`${favorites.length} টি বুকমার্ক`, `${favorites.length} bookmarks`, `${favorites.length} إشارات`)}
            </p>
            {favorites.map((fav) => {
              const surah = surahList.find(s => s.number === fav.surah);
              return (
                <Card key={`${fav.surah}-${fav.ayah}`} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                        {surah ? (language === "bn" ? surah.bengaliName : surah.englishName) : fav.surah}
                      </span>
                      <span className="text-xs text-muted-foreground">{t(`আয়াত ${fav.ayah}`, `Ayah ${fav.ayah}`, `آية ${fav.ayah}`)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedSurah(fav.surah); onNavigateToReading(fav.surah); }}
                        className="p-1.5 rounded-full hover:bg-primary/10 transition-colors text-primary"><BookOpen className="w-4 h-4" /></button>
                      <button onClick={() => toggleFavorite(fav.surah, fav.ayah)}
                        className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {fav.text && <p className="font-arabic text-base leading-[2] text-foreground/80" dir="rtl">{fav.text}</p>}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
