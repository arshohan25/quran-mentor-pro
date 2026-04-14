import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const langs = [
  { id: "bn" as const, label: "বাংলা", flag: "🇧🇩" },
  { id: "en" as const, label: "English", flag: "🇬🇧" },
  { id: "ar" as const, label: "عربي", flag: "🇸🇦" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const current = langs.find((l) => l.id === language) || langs[0];

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium">{current.flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[120px]">
          {langs.map((l) => (
            <DropdownMenuItem
              key={l.id}
              onClick={() => setLanguage(l.id)}
              className={`text-sm gap-2 ${language === l.id ? "font-bold bg-accent/20" : ""}`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
