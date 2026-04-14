import { Link, useLocation } from "react-router-dom";
import { BookOpen, Compass, CircleDot, Home, HandHeart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const NAV_ITEMS = [
  { icon: Home, path: "/", labelBn: "হোম", labelEn: "Home", labelAr: "الرئيسية" },
  { icon: BookOpen, path: "/quran", labelBn: "কুরআন", labelEn: "Quran", labelAr: "القرآن" },
  { icon: Compass, path: "/qibla", labelBn: "কিবলা", labelEn: "Qibla", labelAr: "القبلة" },
  { icon: CircleDot, path: "/tasbih", labelBn: "তাসবিহ", labelEn: "Tasbih", labelAr: "تسبيح" },
  { icon: HandHeart, path: "/prayer-times", labelBn: "নামাজ", labelEn: "Prayer", labelAr: "الصلاة" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-xl safe-bottom" style={{ borderColor: 'hsl(var(--gold) / 0.1)' }}>
      <div className="flex items-center justify-around max-w-lg mx-auto h-[58px]">
        {NAV_ITEMS.map((item) => {
          const active = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-16 py-1.5 transition-all duration-300 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {active && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-primary" />
              )}
              <item.icon className={`w-5 h-5 transition-all ${active ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
              <span className="text-[10px] font-semibold leading-none mt-0.5">
                {language === "bn" ? item.labelBn : language === "ar" ? item.labelAr : item.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
