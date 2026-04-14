import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Trash2, ExternalLink, BookOpen } from "lucide-react";
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
        <div className="container flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80 p-1"><ArrowLeft className="w-5 h-5" strokeWidth={1.8} /></Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t("বুকমার্ক", "Bookmarks", "المحفوظات")}</h1>
              <p className="text-primary-foreground/50 text-[10px]">{t("সেভ করা আয়াত", "Saved ayahs", "الآيات المحفوظة")}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-5">
        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="icon-container-gold w-20 h-20 mx-auto mb-4">
              <Heart className="w-8 h-8 text-accent/40" strokeWidth={1.4} />
            </div>
            <p className="text-lg font-bold text-foreground">
              {t("কোনো আয়াত বুকমার্ক করা হয়নি", "No bookmarks yet", "لم يتم حفظ أي آيات")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("কুরআন পেজে গিয়ে ❤️ আইকনে ক্লিক করুন", "Tap ❤️ on Quran page to save", "اضغط ❤️ في صفحة القرآن")}
            </p>
            <Link to="/quran" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">
              <BookOpen className="w-4 h-4" strokeWidth={1.8} />
              {t("কুরআন পড়ুন", "Read Quran", "اقرأ القرآن")}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              {sorted.length} {t("টি আয়াত সেভ করা আছে", " ayahs saved", " آيات محفوظة")}
            </p>
            <ScrollArea className="h-[calc(100vh-180px)] min-h-[300px]">
              <div className="space-y-2.5">
                {sorted.map((fav) => {
                  const surah = surahList.find((s) => s.number === fav.surah);
                  return (
                    <div key={`${fav.surah}-${fav.ayah}`} className="premium-card p-4 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: 'linear-gradient(to bottom, hsl(var(--accent)), hsl(var(--primary)))' }} />
                      <div className="flex items-center justify-between mb-3 pl-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-bold border border-accent/15">
                            {fav.ayah}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-foreground">
                              {surah ? language === "bn" ? surah.bengaliName : surah.englishName : `Surah ${fav.surah}`}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {t("আয়াত", "Ayah", "آية")} {fav.ayah}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link to={`/quran?surah=${fav.surah}`} className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                            <ExternalLink className="w-4 h-4" strokeWidth={1.8} />
                          </Link>
                          <button onClick={() => toggleFavorite(fav.surah, fav.ayah)} className="p-2 rounded-xl text-destructive hover:bg-destructive/8 transition-colors">
                            <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>
                      {fav.text && (
                        <p className="font-arabic text-xl leading-loose text-foreground text-right pl-3">{fav.text}</p>
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
