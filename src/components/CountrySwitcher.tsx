import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserCountry, COMMON_COUNTRIES } from "@/hooks/useUserCountry";

export default function CountrySwitcher({ className }: { className?: string }) {
  const { country, setCountry } = useUserCountry();
  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={country ?? "auto"} onValueChange={(v) => setCountry(v === "auto" ? null : v)}>
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Auto-detect</SelectItem>
          {COMMON_COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>{c.name} ({c.code.toUpperCase()})</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
