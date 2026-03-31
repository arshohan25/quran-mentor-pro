import { applyTajweedColors, tajweedLegend } from "@/utils/tajweed";
import { useLanguage } from "@/contexts/LanguageContext";

interface TajweedTextProps {
  text: string;
  enabled: boolean;
  className?: string;
}

export default function TajweedText({ text, enabled, className = "" }: TajweedTextProps) {
  const isInline = className.includes("inline");
  const Tag = isInline ? "span" : "p";

  if (!enabled) {
    return <Tag className={className}>{text}</Tag>;
  }

  const html = applyTajweedColors(text);
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function TajweedLegend() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-muted/50 border border-border">
      <span className="text-xs text-muted-foreground font-semibold">
        {t("তাজবীদ:", "Tajweed:", "التجويد:")}
      </span>
      {tajweedLegend.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-foreground">{item.nameBn}</span>
        </div>
      ))}
    </div>
  );
}
