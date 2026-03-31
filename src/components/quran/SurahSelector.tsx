import { useState } from "react";
import { surahList } from "@/data/surahList";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  value: number;
  onChange: (n: number) => void;
  variant?: "header" | "default";
}

export default function SurahSelector({ value, onChange, variant = "header" }: Props) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const currentSurah = surahList.find((s) => s.number === value);
  const displayName = currentSurah
    ? `${currentSurah.number}. ${language === "bn" ? currentSurah.bengaliName : currentSurah.englishName}`
    : "";

  const filtered = surahList.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.englishName.toLowerCase().includes(q) ||
      s.bengaliName.includes(q) ||
      s.name.includes(q) ||
      String(s.number).includes(q)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={
            variant === "header"
              ? "h-7 md:h-8 text-xs bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 px-2.5"
              : "h-9 text-sm"
          }
        >
          {displayName}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t("সূরা খুঁজুন...", "Search surah...", "ابحث عن سورة...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs pl-8"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="p-1">
            {filtered.map((s) => (
              <button
                key={s.number}
                onClick={() => { onChange(s.number); setOpen(false); setSearch(""); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors hover:bg-primary/5 ${
                  s.number === value ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                <span className="w-7 h-7 rounded-md bg-primary/8 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                  {s.number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {language === "bn" ? s.bengaliName : s.englishName}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-arabic" dir="rtl">
                    {s.name}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {s.numberOfAyahs} {t("আয়াত", "ayahs", "آيات")}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t("পাওয়া যায়নি", "Not found", "لم يتم العثور")}
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
