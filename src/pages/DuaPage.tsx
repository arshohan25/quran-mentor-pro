import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Heart, HandHeart, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DUAS, CATEGORIES } from "@/data/duaData";

export default function DuaPage() {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("dua-favorites") || "[]"); } catch { return []; }
  });

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("dua-favorites", JSON.stringify(next));
      return next;
    });
  };

  const filtered = DUAS.filter((d) => {
    if (activeCategory !== "all" && d.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.arabic.includes(q) || d.bn.toLowerCase().includes(q) || d.en.toLowerCase().includes(q) || d.transliteration.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80 p-1"><ArrowLeft className="w-5 h-5" strokeWidth={1.8} /></Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t("দোয়া ও যিকর", "Duas & Azkar", "الأدعية والأذكار")}</h1>
              <p className="text-primary-foreground/50 text-[10px]">{t("দৈনন্দিন দোয়া সংগ্রহ", "Daily dua collection", "مجموعة الأدعية")}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container py-4 space-y-3.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("দোয়া খুঁজুন...", "Search duas...", "ابحث عن دعاء...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/20"
                }`}
              >
                {language === "bn" ? cat.bn : language === "ar" ? cat.ar : cat.en}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-3">
          {filtered.map((dua) => (
            <div key={dua.id} className="premium-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="premium-badge">
                  {language === "bn" ? dua.categoryBn : language === "ar" ? dua.categoryAr : dua.category}
                </span>
                <button onClick={() => toggleFavorite(dua.id)} className="p-1.5 rounded-lg transition-colors hover:bg-destructive/10">
                  <Heart className={`w-4 h-4 ${favorites.includes(dua.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} strokeWidth={1.8} />
                </button>
              </div>
              <p className="font-arabic text-xl leading-[2.2] text-foreground">{dua.arabic}</p>
              <p className="text-xs text-accent italic font-medium">{dua.transliteration}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === "bn" ? dua.bn : dua.en}
              </p>
              <p className="text-[10px] text-muted-foreground/50 border-t border-border pt-2 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {dua.reference}
              </p>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <HandHeart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1.2} />
              <p className="text-sm text-muted-foreground">
                {t("কোনো দোয়া পাওয়া যায়নি", "No duas found", "لم يتم العثور على أدعية")}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
