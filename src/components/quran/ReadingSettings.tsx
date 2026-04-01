import { useState } from "react";
import { Settings, Moon, Sun, Type } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  fontSize: number;
  setFontSize: (n: number) => void;
  tajweedEnabled?: boolean;
  onTajweedToggle?: () => void;
}

export default function ReadingSettings({ fontSize, setFontSize, tajweedEnabled, onTajweedToggle }: Props) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-4" align="end">
        <h3 className="font-semibold text-sm">{t("সেটিংস", "Settings", "الإعدادات")}</h3>

        {/* Theme toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>{t("ডার্ক মোড", "Dark Mode", "الوضع الداكن")}</span>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>

        {/* Font size */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Type className="w-4 h-4" />
            <span>{t("ফন্ট সাইজ", "Font Size", "حجم الخط")}</span>
            <span className="ml-auto text-xs text-muted-foreground">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            min={16}
            max={36}
            step={2}
          />
          <p className="font-arabic text-center" dir="rtl" style={{ fontSize: `${fontSize}px` }}>
            بِسْمِ ٱللَّهِ
          </p>
        </div>

        {/* Tajweed toggle */}
        {onTajweedToggle !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm">{t("তাজবীদ", "Tajweed", "التجويد")}</span>
            <Switch checked={tajweedEnabled} onCheckedChange={onTajweedToggle} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
