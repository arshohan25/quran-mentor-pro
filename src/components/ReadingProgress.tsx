import { useReadingTarget } from "@/hooks/useReadingTarget";
import { useLanguage } from "@/contexts/LanguageContext";
import { Flame, Target, Trophy, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ReadingProgress() {
  const { t } = useLanguage();
  const { todayProgress, currentStreak, totalPages, totalDays, target, last7Days, badges } = useReadingTarget();
  const earnedBadges = badges.filter((b) => b.earned);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="islamic-card p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          {t("আজকের লক্ষ্য", "Today's Goal", "هدف اليوم")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {target.pagesPerDay} {t("পৃষ্ঠা/দিন", "pages/day", "صفحات/يوم")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <Progress value={todayProgress} className="h-2.5" />
        <p className="text-xs text-muted-foreground text-center">
          {Math.round(todayProgress)}% {t("সম্পন্ন", "complete", "مكتمل")}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-primary/5">
          <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{currentStreak}</p>
          <p className="text-[10px] text-muted-foreground">{t("দিনের ধারা", "Day Streak", "أيام متتالية")}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-primary/5">
          <BookOpen className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{totalPages}</p>
          <p className="text-[10px] text-muted-foreground">{t("মোট পৃষ্ঠা", "Total Pages", "إجمالي الصفحات")}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-primary/5">
          <Trophy className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{earnedBadges.length}</p>
          <p className="text-[10px] text-muted-foreground">{t("ব্যাজ", "Badges", "شارات")}</p>
        </div>
      </div>

      {/* Weekly activity */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">{t("সাপ্তাহিক কার্যকলাপ", "Weekly Activity", "النشاط الأسبوعي")}</p>
        <div className="flex items-end justify-between gap-1 h-12">
          {last7Days.map((day, i) => {
            const maxPages = Math.max(...last7Days.map((d) => d.pages), 1);
            const height = day.pages > 0 ? Math.max(20, (day.pages / maxPages) * 100) : 8;
            const dayOfWeek = new Date(day.date).getDay();
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-sm transition-all ${
                    day.pages > 0 ? "bg-primary/70" : "bg-muted"
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[9px] text-muted-foreground">{dayLabels[dayOfWeek]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {earnedBadges.map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-[10px] font-medium text-accent"
              title={b.description}
            >
              {b.icon} {b.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
