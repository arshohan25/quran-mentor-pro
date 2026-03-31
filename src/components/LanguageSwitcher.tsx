import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const langs = [
    { id: "bn" as const, label: "বাংলা" },
    { id: "en" as const, label: "EN" },
    { id: "ar" as const, label: "عربي" },
  ];

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
        onClick={toggleTheme}
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
      <div className="flex gap-0.5 bg-white/10 rounded-lg p-0.5">
        {langs.map((l) => (
          <Button
            key={l.id}
            size="sm"
            variant="ghost"
            className={`text-xs px-3 py-1 h-7 rounded-md transition-all ${
              language === l.id
                ? "bg-accent/90 text-accent-foreground shadow-sm font-semibold"
                : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
            }`}
            onClick={() => setLanguage(l.id)}
          >
            {l.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
