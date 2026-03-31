import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Dua {
  id: number;
  category: string;
  categoryBn: string;
  categoryAr: string;
  arabic: string;
  transliteration: string;
  bn: string;
  en: string;
  reference: string;
}

const DUAS: Dua[] = [
  { id: 1, category: "Morning", categoryBn: "সকালের আযকার", categoryAr: "أذكار الصباح", arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ", transliteration: "Asbahna wa asbahal mulku lillah, walhamdu lillah", bn: "আমরা সকালে উপনীত হলাম এবং সকালে রাজত্ব আল্লাহর জন্য, সকল প্রশংসা আল্লাহর", en: "We have entered the morning and the kingdom belongs to Allah. All praise is for Allah.", reference: "মুসলিম" },
  { id: 2, category: "Morning", categoryBn: "সকালের আযকার", categoryAr: "أذكار الصباح", arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", transliteration: "Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan nushur", bn: "হে আল্লাহ, তোমার রহমতে সকালে উপনীত হলাম, তোমার রহমতে সন্ধ্যায় উপনীত হই, তোমার ইচ্ছায় বাঁচি ও মরি", en: "O Allah, by Your grace we enter the morning, and by Your grace we enter the evening.", reference: "তিরমিযী" },
  { id: 3, category: "Evening", categoryBn: "সন্ধ্যার আযকার", categoryAr: "أذكار المساء", arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ", transliteration: "Amsayna wa amsal mulku lillah walhamdu lillah", bn: "আমরা সন্ধ্যায় উপনীত হলাম এবং সন্ধ্যায় রাজত্ব আল্লাহর জন্য", en: "We have entered the evening and the kingdom belongs to Allah.", reference: "মুসলিম" },
  { id: 4, category: "Evening", categoryBn: "সন্ধ্যার আযকার", categoryAr: "أذكار المساء", arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ", transliteration: "Allahumma bika amsayna wa bika asbahna wa bika nahya wa bika namutu wa ilaykal masir", bn: "হে আল্লাহ, তোমার রহমতে সন্ধ্যায় উপনীত হলাম, তোমার ইচ্ছায় বাঁচি ও মরি এবং তোমার কাছেই প্রত্যাবর্তন", en: "O Allah, by Your grace we enter the evening. By Your will we live and die, and to You is the return.", reference: "তিরমিযী" },
  { id: 5, category: "Food", categoryBn: "খাবারের দোয়া", categoryAr: "دعاء الطعام", arabic: "بِسْمِ اللّٰهِ وَعَلَى بَرَكَةِ اللّٰهِ", transliteration: "Bismillahi wa 'ala barakatillah", bn: "আল্লাহর নামে এবং আল্লাহর বরকতে (শুরু করছি)", en: "In the name of Allah and with the blessings of Allah.", reference: "আবু দাউদ" },
  { id: 6, category: "Food", categoryBn: "খাবারের দোয়া", categoryAr: "دعاء الطعام", arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ", transliteration: "Alhamdu lillahil ladhi at'amana wa saqana wa ja'alana muslimin", bn: "সকল প্রশংসা আল্লাহর যিনি আমাদের খাওয়ালেন, পান করালেন এবং মুসলিম বানালেন", en: "All praise is for Allah who fed us, gave us drink, and made us Muslims.", reference: "আবু দাউদ, তিরমিযী" },
  { id: 7, category: "Sleep", categoryBn: "ঘুমের দোয়া", categoryAr: "دعاء النوم", arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", transliteration: "Bismika Allahumma amutu wa ahya", bn: "হে আল্লাহ, তোমার নামেই মরি এবং বাঁচি", en: "In Your name, O Allah, I die and I live.", reference: "বুখারী" },
  { id: 8, category: "Sleep", categoryBn: "ঘুমের দোয়া", categoryAr: "دعاء النوم", arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", transliteration: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak", bn: "হে আল্লাহ, যেদিন তুমি তোমার বান্দাদের পুনরুত্থিত করবে সেদিন আমাকে তোমার শাস্তি থেকে রক্ষা করো", en: "O Allah, protect me from Your punishment on the day You resurrect Your servants.", reference: "আবু দাউদ" },
  { id: 9, category: "Travel", categoryBn: "সফরের দোয়া", categoryAr: "دعاء السفر", arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ", transliteration: "Subhanalladhi sakh-khara lana hadha wa ma kunna lahu muqrinin", bn: "পবিত্র সেই সত্তা যিনি এটিকে আমাদের বশীভূত করে দিয়েছেন, আমরা একে বশ করতে সক্ষম ছিলাম না", en: "Glory be to Him who has subjected this to us, and we could not have subdued it.", reference: "মুসলিম" },
  { id: 10, category: "Mosque", categoryBn: "মসজিদের দোয়া", categoryAr: "دعاء المسجد", arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", transliteration: "Allahummaf-tah li abwaba rahmatik", bn: "হে আল্লাহ, আমার জন্য তোমার রহমতের দরজা খুলে দাও", en: "O Allah, open for me the doors of Your mercy.", reference: "মুসলিম" },
  { id: 11, category: "Distress", categoryBn: "বিপদের দোয়া", categoryAr: "دعاء الكرب", arabic: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin", bn: "তুমি ছাড়া কোনো ইলাহ নেই, তুমি পবিত্র, নিশ্চয় আমি যালিমদের অন্তর্ভুক্ত ছিলাম", en: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.", reference: "কুরআন ২১:৮৭" },
  { id: 12, category: "Forgiveness", categoryBn: "ক্ষমার দোয়া", categoryAr: "دعاء الاستغفار", arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ", transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduk", bn: "হে আল্লাহ, তুমি আমার রব, তুমি ছাড়া কোনো ইলাহ নেই, তুমি আমাকে সৃষ্টি করেছ এবং আমি তোমার বান্দা", en: "O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant.", reference: "বুখারী (সাইয়িদুল ইস্তিগফার)" },
];

const CATEGORIES = [
  { id: "all", bn: "সব", en: "All", ar: "الكل" },
  { id: "Morning", bn: "সকাল", en: "Morning", ar: "الصباح" },
  { id: "Evening", bn: "সন্ধ্যা", en: "Evening", ar: "المساء" },
  { id: "Food", bn: "খাবার", en: "Food", ar: "الطعام" },
  { id: "Sleep", bn: "ঘুম", en: "Sleep", ar: "النوم" },
  { id: "Travel", bn: "সফর", en: "Travel", ar: "السفر" },
  { id: "Mosque", bn: "মসজিদ", en: "Mosque", ar: "المسجد" },
  { id: "Distress", bn: "বিপদ", en: "Distress", ar: "الكرب" },
  { id: "Forgiveness", bn: "ক্ষমা", en: "Forgiveness", ar: "الاستغفار" },
];

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
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("দোয়া খুঁজুন...", "Search duas...", "ابحث عن دعاء...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        {/* Category pills */}
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

        {/* Duas list */}
        <div className="space-y-3">
          {filtered.map((dua) => (
            <div key={dua.id} className="islamic-card p-4 space-y-3">
              {/* Category badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {language === "bn" ? dua.categoryBn : language === "ar" ? dua.categoryAr : dua.category}
                </span>
                <button onClick={() => toggleFavorite(dua.id)} className="p-1 transition-colors">
                  <Heart className={`w-4 h-4 ${favorites.includes(dua.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                </button>
              </div>

              {/* Arabic text */}
              <p className="font-arabic text-xl leading-[2.2] text-foreground">{dua.arabic}</p>

              {/* Transliteration */}
              <p className="text-xs text-accent italic">{dua.transliteration}</p>

              {/* Translation */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === "bn" ? dua.bn : dua.en}
              </p>

              {/* Reference */}
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
