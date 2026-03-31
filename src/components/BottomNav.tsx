import { Link, useLocation } from "react-router-dom";
import { Home, Book, Compass, Hash, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const NAV_ITEMS = [
  { icon: Home, path: "/", labelBn: "হোম", labelEn: "Home", labelAr: "الرئيسية" },
  { icon: Book, path: "/quran", labelBn: "কুরআন", labelEn: "Quran", labelAr: "القرآن" },
  { icon: Compass, path: "/qibla", labelBn: "কিবলা", labelEn: "Qibla", labelAr: "القبلة" },
  { icon: Hash, path: "/tasbih", labelBn: "তাসবিহ", labelEn: "Tasbih", labelAr: "تسبيح" },
  { icon: Clock, path: "/prayer-times", labelBn: "নামাজ", labelEn: "Prayer", labelAr: "الصلاة" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {NAV_ITEMS.map((item) => {
          const active = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-none">
                {language === "bn" ? item.labelBn : language === "ar" ? item.labelAr : item.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
