import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getReviewHistory } from "@/hooks/useStreakTracker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";

type Period = "week" | "month";
type ChartType = "bar" | "area";

export default function HifzProgressChart() {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<Period>("week");
  const [chartType, setChartType] = useState<ChartType>("bar");

  const data = useMemo(() => {
    const days = period === "week" ? 7 : 30;
    const raw = getReviewHistory(days);

    return raw.map(d => {
      const dt = new Date(d.date);
      const label = period === "week"
        ? dt.toLocaleDateString(language === "bn" ? "bn-BD" : language === "ar" ? "ar-SA" : "en-US", { weekday: "short" })
        : `${dt.getDate()}`;
      return {
        label,
        minutes: d.minutes,
        reviewed: d.reviewed,
      };
    });
  }, [period, language]);

  const totalMinutes = data.reduce((s, d) => s + d.minutes, 0);
  const totalReviewed = data.reduce((s, d) => s + d.reviewed, 0);
  const avgMinutes = Math.round(totalMinutes / data.length);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">
            {t("প্রগ্রেস রিপোর্ট", "Progress Report", "تقرير التقدم")}
          </span>
        </div>

        <div className="flex gap-1">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["week", "month"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {p === "week" ? t("সপ্তাহ", "Week", "أسبوع") : t("মাস", "Month", "شهر")}
              </button>
            ))}
          </div>
          <button
            onClick={() => setChartType(chartType === "bar" ? "area" : "bar")}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            {chartType === "bar" ? <TrendingUp className="w-3 h-3 text-muted-foreground" /> : <BarChart3 className="w-3 h-3 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-primary/10 p-2 text-center">
          <p className="text-lg font-bold text-primary">{totalMinutes}<span className="text-[10px] font-normal">m</span></p>
          <p className="text-[9px] text-muted-foreground">{t("মোট সময়", "Total Time", "الوقت الكلي")}</p>
        </div>
        <div className="rounded-lg bg-accent/10 p-2 text-center">
          <p className="text-lg font-bold text-accent">{totalReviewed}</p>
          <p className="text-[9px] text-muted-foreground">{t("রিভিউ", "Reviews", "مراجعات")}</p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-lg font-bold text-foreground">{avgMinutes}<span className="text-[10px] font-normal">m</span></p>
          <p className="text-[9px] text-muted-foreground">{t("গড়/দিন", "Avg/day", "معدل/يوم")}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "minutes" ? t("মিনিট", "Minutes", "دقائق") : t("রিভিউ", "Reviews", "مراجعات"),
                ]}
              />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reviewed" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "minutes" ? t("মিনিট", "Minutes", "دقائق") : t("রিভিউ", "Reviews", "مراجعات"),
                ]}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="reviewed"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent))"
                fillOpacity={0.2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
          {t("সময় (মিনিট)", "Time (min)", "الوقت (دقائق)")}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent" />
          {t("রিভিউ", "Reviews", "مراجعات")}
        </span>
      </div>
    </div>
  );
}
