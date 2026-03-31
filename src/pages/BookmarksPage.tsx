import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Trash2, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { surahList } from "@/data/surahList";
import { ScrollArea } from "@/components/ui/scroll-area";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function BookmarksPage() {
  const { t, language } = useLanguage();
  const { bookmarks, toggleFavorite } = useBookmark();
  const favorites = bookmarks.favorites || [];
  const sorted = [...favorites].sort((a, b) => b.addedAt - a.addedAt);

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl font-bold">{t("বুকমার্ক করা আয়াত", "Bookmarked Ayahs", "الآيات المحفوظة")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-6">
        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-4 border border-accent/20">
              <Heart className="w-10 h-10 text-accent/40" />
            </div>
            <p className="text-lg text-muted-foreground">
              {t("কোনো আয়াত বুকমার্ক করা হয়নি", "No ayahs bookmarked yet", "لم يتم حفظ أي آيات بعد")}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              {t("কুরআন পেজে গিয়ে ❤️ আইকনে ক্লিক করে আয়াত সেভ করুন", "Go to Quran page and tap ❤️ to save ayahs", "اذهب إلى صفحة القرآن واضغط ❤️ لحفظ الآيات")}
            </p>
            <Link to="/quran" className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              {t("কুরআন পড়ুন", "Read Quran", "اقرأ القرآن")}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {sorted.length} {t("টি আয়াত সেভ করা আছে", " ayahs saved", " آيات محفوظة")}
            </p>
            <ScrollArea className="h-[calc(100vh-180px)] min-h-[300px]">
              <div className="space-y-3">
                {sorted.map((fav) => {
                  const surah = surahList.find((s) => s.number === fav.surah);
                  return (
                    <div key={`${fav.surah}-${fav.ayah}`} className="islamic-card p-4 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-xl" />
                      <div className="flex items-center justify-between mb-3 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold border border-accent/20">
                            {fav.ayah}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {surah ? language === "bn" ? surah.bengaliName : surah.englishName : `Surah ${fav.surah}`}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {t("আয়াত", "Ayah", "آية")} {fav.ayah}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link to={`/quran?surah=${fav.surah}`} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button onClick={() => toggleFavorite(fav.surah, fav.ayah)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {fav.text && (
                        <p className="font-arabic text-xl leading-loose text-foreground text-right pl-2">{fav.text}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
