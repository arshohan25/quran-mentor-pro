import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const langs = [
    { id: "bn" as const, label: "বাংলা" },
    { id: "en" as const, label: "EN" },
    { id: "ar" as const, label: "عربي" },
  ];

  return (
    <div className="flex gap-1 bg-background/20 rounded-lg p-1">
      {langs.map((l) => (
        <Button
          key={l.id}
          size="sm"
          variant={language === l.id ? "secondary" : "ghost"}
          className={`text-xs px-3 py-1 h-7 ${language === l.id ? "bg-background/30 text-primary-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"}`}
          onClick={() => setLanguage(l.id)}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
