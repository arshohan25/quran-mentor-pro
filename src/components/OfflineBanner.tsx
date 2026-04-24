import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useLanguage } from "@/contexts/LanguageContext";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  const { t } = useLanguage();
  if (online) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none px-3 pt-2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-muted text-foreground border border-border shadow-sm px-3 py-1 text-[11px] font-medium">
        <WifiOff className="w-3 h-3 text-destructive" />
        {t("অফলাইন মোড — ক্যাশ থেকে দেখা হচ্ছে", "Offline — showing cached content")}
      </div>
    </div>
  );
}
