import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Globe } from "lucide-react";

const langs = [
  { id: "bn" as const, flag: "🇧🇩" },
  { id: "en" as const, flag: "🇬🇧" },
  { id: "ar" as const, flag: "🇸🇦" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const currentIndex = langs.findIndex((l) => l.id === language);
  const current = langs[currentIndex >= 0 ? currentIndex : 0];

  const cycleLanguage = () => {
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex].id);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
        onClick={toggleTheme}
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="h-7 gap-1 px-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
        onClick={cycleLanguage}
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium">{current.flag}</span>
      </Button>
    </div>
  );
}
