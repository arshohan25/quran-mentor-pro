import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Loader2, Mic, Search, History } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { HADITH_COLLECTIONS } from "@/data/hadithCollections";
import { useHadithChapters } from "@/hooks/useHadithApi";
import { getAllPracticeSessions } from "@/hooks/useHadithPractice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HadithPracticeSetupPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [book, setBook] = useState<string>("muslim");
  const [chapter, setChapter] = useState<string>("");
  const [query, setQuery] = useState("");

  const { data: chapters, isLoading, error } = useHadithChapters(book);

  const filtered = useMemo(() => {
    if (!chapters) return [];
    const q = query.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter(
      (c) =>
        c.chapterEnglish.toLowerCase().includes(q) ||
        (c.chapterBengali || "").toLowerCase().includes(q)
    );
  }, [chapters, query]);

  const lastSession = useMemo(() => getAllPracticeSessions()[0] || null, []);

  const start = () => {
    if (!book || !chapter) return;
    navigate(`/hadith/${book}/${chapter}?practice=1`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="islamic-header">
        <div className="container flex items-center gap-3 relative z-10">
          <Link to="/" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight flex items-center gap-2">
              <Mic className="w-4 h-4" />
              {t("হাদীস অনুশীলন", "Hadith Practice")}
            </h1>
            <p className="text-primary-foreground/60 text-[10px]">
              {t("বই ও বিষয় বেছে নিয়ে শুরু করুন", "Pick a book and topic to begin")}
            </p>
          </div>
        </div>
      </header>

      <main className="container py-4 max-w-2xl mx-auto space-y-5">
        {lastSession && (
          <Card className="p-3 flex items-center gap-3 border-accent/30 bg-accent/5">
            <History className="w-4 h-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">
                {t("আগের সেশন চালিয়ে যান", "Resume last session")}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {t("হাদীস", "Hadith")} #{lastSession.hadithId} ·{" "}
                {new Date(lastSession.updatedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </Card>
        )}

        {/* Step 1: Book */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold">
              {t("বই বেছে নিন", "Choose a book")}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {HADITH_COLLECTIONS.map((c) => {
              const active = book === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setBook(c.id);
                    setChapter("");
                    setQuery("");
                  }}
                  className={`text-left rounded-xl border p-2.5 transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen
                      className={`w-3.5 h-3.5 ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <p className="text-xs font-bold truncate">
                      {language === "bn" ? c.bnName : c.enName}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {c.totalHadith.toLocaleString()} {t("হাদীস", "hadith")}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Chapter / Topic */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                book
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </span>
            <h2 className="text-sm font-bold">
              {t("বিষয় বেছে নিন", "Choose a topic")}
            </h2>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("বিষয় খুঁজুন...", "Search topics...")}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <p className="text-center text-sm text-destructive py-4">
              {t("লোড করা যায়নি", "Failed to load")}
            </p>
          )}

          {!isLoading && filtered.length === 0 && chapters && (
            <p className="text-center text-xs text-muted-foreground py-6">
              {t("কোনো বিষয় পাওয়া যায়নি", "No topics found")}
            </p>
          )}

          <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
            {filtered.map((ch) => {
              const active = chapter === ch.chapterNumber;
              const title =
                language === "bn"
                  ? ch.chapterBengali || ch.chapterEnglish
                  : ch.chapterEnglish;
              const sub =
                language === "bn" && ch.chapterBengali ? ch.chapterEnglish : null;
              return (
                <button
                  key={ch.id}
                  onClick={() => setChapter(ch.chapterNumber)}
                  className={`w-full text-left rounded-lg border p-2.5 flex items-center gap-2.5 transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {ch.chapterNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{title}</p>
                    {sub && (
                      <p className="text-[10px] text-muted-foreground/70 truncate">
                        {sub}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {ch.hadithCount} {t("হাদীস", "hadith")}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Sticky start button */}
      <div className="fixed bottom-14 left-0 right-0 z-30 border-t border-border/40 bg-background/95 backdrop-blur p-3">
        <div className="container max-w-2xl mx-auto">
          <Button onClick={start} disabled={!book || !chapter} className="w-full">
            {t("অনুশীলন শুরু করুন", "Start practicing")}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
