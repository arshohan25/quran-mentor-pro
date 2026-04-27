import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePublicAppConfig } from "@/hooks/usePublicAppConfig";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  value: string | null;
  onChange: (lessonId: string | null) => void;
  className?: string;
}

export default function LessonPicker({ value, onChange, className }: Props) {
  const { lessonItems } = usePublicAppConfig();
  const { language } = useLanguage();
  const enabled = lessonItems.filter((l) => l.enabled);

  if (enabled.length === 0) return null;

  const labelFor = (l: (typeof enabled)[number]) =>
    (language === "bn" ? l.title_bn : language === "ar" ? l.title_ar : l.title_en) ?? l.id;

  return (
    <Select value={value ?? "none"} onValueChange={(v) => onChange(v === "none" ? null : v)}>
      <SelectTrigger className={className ?? "h-8 text-xs w-44"}>
        <SelectValue placeholder="Lesson" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No lesson</SelectItem>
        {enabled.map((l) => (
          <SelectItem key={l.id} value={l.id}>{labelFor(l)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
