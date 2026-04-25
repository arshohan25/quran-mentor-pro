import { Link } from "react-router-dom";
import { ListChecks, Flame, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { getTodayCompleted, getAmalStreak, TOTAL_AMALS } from "@/lib/dailyAmal";

export default function DailyAmalSummaryCard() {
  const { t } = useLanguage();
  const [done, setDone] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    const refresh = () => {
      setDone(getTodayCompleted().length);
      setStreak(getAmalStreak());
    };
    refresh();
    const onVis = () => { if (!document.hidden) refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const pct = Math.round((done / TOTAL_AMALS) * 100);
  const remaining = Math.max(0, TOTAL_AMALS - done);
  const allDone = done >= TOTAL_AMALS;

  return (
    <Link
      to="/daily-amal"
      className="premium-card p-4 block group animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="icon-container-gold p-1.5 group-hover:scale-110 transition-transform">
            <ListChecks className="w-4 h-4 text-accent" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-tight">
              {t("দৈনিক আমল", "Daily Amal", "الأعمال اليومية")}
            </h3>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              {allDone
                ? t("আজকের সব আমল সম্পন্ন ✨", "All done for today ✨", "اكتمل كل شيء لليوم ✨")
                : t(`আরও ${remaining} বাকি`, `${remaining} left today`, `${remaining} متبقية`)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 border border-accent/20">
          <Flame className="w-3 h-3 text-accent" />
          <span className="text-[11px] font-bold text-accent leading-none">
            {streak} {t("দিন", "d", "ي")}
          </span>
        </div>
      </div>

      <Progress value={pct} className="h-1.5" />
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[10px] text-muted-foreground font-medium">
          {done} / {TOTAL_AMALS} {t("সম্পন্ন", "completed", "مكتمل")}
        </p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
          {allDone && <Sparkles className="w-3 h-3 text-accent" />}
          <span>{pct}%</span>
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
