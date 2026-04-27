import { useMemo } from "react";
import { qariList } from "@/data/prayerData";
import { useSelectedReciter } from "@/hooks/useSelectedReciter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic2 } from "lucide-react";

interface Props {
  /**
   * Current session-scoped reciter override. `null` means "follow the
   * app-wide selected qari" — the picker shows the global value but does
   * not persist it as an override until the user explicitly changes it.
   */
  value: string | null;
  onChange: (next: string | null) => void;
  /** Visual variant — "compact" for inline in headers, "default" for cards. */
  variant?: "compact" | "default";
  className?: string;
}

const FOLLOW_GLOBAL = "__follow_global__";

/**
 * Session-scoped reciter override. Lets the user pick a different qari for
 * the current Hifz/Live session without changing their app-wide preference.
 * Falls back transparently to the global selection when no override is set.
 */
export default function SessionReciterPicker({ value, onChange, variant = "compact", className = "" }: Props) {
  const { language, t } = useLanguage();
  const { reciterId: globalReciterId } = useSelectedReciter();

  const effectiveValue = value ?? FOLLOW_GLOBAL;

  const globalLabel = useMemo(() => {
    const q = qariList.find((q) => q.id === globalReciterId);
    return q ? (language === "bn" ? q.nameBn : q.name) : globalReciterId;
  }, [globalReciterId, language]);

  const triggerClass =
    variant === "compact"
      ? "h-8 text-xs min-w-[140px] max-w-[180px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
      : "h-9 text-sm";

  return (
    <Select
      value={effectiveValue}
      onValueChange={(v) => onChange(v === FOLLOW_GLOBAL ? null : v)}
    >
      <SelectTrigger
        className={`${triggerClass} ${className}`}
        title={t("কারী নির্বাচন (এই সেশনের জন্য)", "Pick reciter (this session)", "اختر القارئ (لهذه الجلسة)")}
      >
        <Mic2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={FOLLOW_GLOBAL} className="text-xs">
          {t("ডিফল্ট", "Default", "افتراضي")} · {globalLabel}
        </SelectItem>
        {qariList.map((q) => (
          <SelectItem key={q.id} value={q.id} className="text-xs">
            {language === "bn" ? q.nameBn : q.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
