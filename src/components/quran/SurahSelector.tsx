import { surahList } from "@/data/surahList";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  value: number;
  onChange: (n: number) => void;
  variant?: "header" | "default";
}

export default function SurahSelector({ value, onChange, variant = "header" }: Props) {
  const { language } = useLanguage();
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger
        className={
          variant === "header"
            ? "w-auto min-w-[100px] md:min-w-[140px] h-7 md:h-8 text-xs bg-primary-foreground/10 border-none text-primary-foreground"
            : "h-9 text-sm"
        }
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {surahList.map((s) => (
          <SelectItem key={s.number} value={String(s.number)} className="text-xs">
            {s.number}. {language === "bn" ? s.bengaliName : s.englishName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
