import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Heart } from "lucide-react";
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
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-lg font-bold">{t("দোয়া ও যিকর", "Duas & Azkar", "الأدعية والأذكار")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("দোয়া খুঁজুন...", "Search duas...", "ابحث عن دعاء...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-accent/40"
                }`}
              >
                {language === "bn" ? cat.bn : language === "ar" ? cat.ar : cat.en}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-3">
          {filtered.map((dua) => (
            <div key={dua.id} className="islamic-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {language === "bn" ? dua.categoryBn : language === "ar" ? dua.categoryAr : dua.category}
                </span>
                <button onClick={() => toggleFavorite(dua.id)} className="p-1 transition-colors">
                  <Heart className={`w-4 h-4 ${favorites.includes(dua.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                </button>
              </div>
              <p className="font-arabic text-xl leading-[2.2] text-foreground">{dua.arabic}</p>
              <p className="text-xs text-accent italic">{dua.transliteration}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === "bn" ? dua.bn : dua.en}
              </p>
              <p className="text-[10px] text-muted-foreground/60 border-t border-border pt-2">
                📖 {dua.reference}
              </p>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {t("কোনো দোয়া পাওয়া যায়নি", "No duas found", "لم يتم العثور على أدعية")}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
