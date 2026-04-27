import { Link, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import { Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePublicAppConfig } from "@/hooks/usePublicAppConfig";

const FALLBACK = [
  { id: "h", path: "/", icon: "Home", label_bn: "হোম", label_en: "Home", label_ar: "الرئيسية", enabled: true, sort_order: 0 },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const { navItems } = usePublicAppConfig();

  const items = (navItems.length ? navItems : (FALLBACK as any))
    .filter((i: any) => i.enabled)
    .slice(0, 5);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-xl safe-bottom"
      style={{ borderColor: "hsl(var(--gold) / 0.1)" }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-[58px]">
        {items.map((item: any) => {
          const active = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          const Icon = (Icons as any)[item.icon] ?? Home;
          const label =
            language === "bn" ? item.label_bn : language === "ar" ? item.label_ar : item.label_en;
          return (
            <Link
              key={item.id ?? item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-16 py-1.5 transition-all duration-300 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {active && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-primary" />
              )}
              <Icon className={`w-5 h-5 transition-all ${active ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
              <span className="text-[10px] font-semibold leading-none mt-0.5">
                {label || item.label_en || item.path}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
