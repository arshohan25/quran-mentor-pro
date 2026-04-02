import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DAILY_AMALS } from "@/data/dailyAmalData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { BarChart3, TrendingUp, Star, Calendar } from "lucide-react";

type Period = "week" | "month";

function getStatsData(days: number) {
  const data: { label: string; date: string; count: number; ids: number[] }[] = [];
  const d = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(d.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    let ids: number[] = [];
    try {
      const raw = localStorage.getItem(`daily-amal-${key}`);
      if (raw) ids = JSON.parse(raw);
    } catch {}
    data.push({
      label: `${dt.getDate()}/${dt.getMonth() + 1}`,
      date: key,
      count: ids.length,
      ids,
    });
  }
  return data;
}

export default function DailyAmalStats() {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<Period>("week");
  const days = period === "week" ? 7 : 30;

  const data = useMemo(() => getStatsData(days), [days]);

  const totalCompleted = data.reduce((s, d) => s + d.count, 0);
  const avgPerDay = days > 0 ? (totalCompleted / days).toFixed(1) : "0";
  const bestDay = data.reduce((best, d) => (d.count > best.count ? d : best), data[0]);

  // Top amals — count how many days each amal was completed
  const amalDayCount = useMemo(() => {
    const map: Record<number, number> = {};
    data.forEach((d) => d.ids.forEach((id) => { map[id] = (map[id] || 0) + 1; }));
    return Object.entries(map)
      .map(([id, count]) => ({ id: Number(id), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [data]);

  const getAmalName = (id: number) => {
    const a = DAILY_AMALS.find((x) => x.id === id);
    if (!a) return "";
    return language === "bn" ? a.bn : language === "ar" ? a.ar : a.en;
  };

  return (
    <div className="islamic-card p-4 space-y-4">
      {/* Header + Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">
            {t("পরিসংখ্যান", "Statistics", "الإحصائيات")}
          </span>
        </div>
        <div className="flex bg-secondary rounded-full p-0.5">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[10px] font-medium rounded-full transition-colors ${
                period === p ? "bg-primary text-primary-foreground" : "text-secondary-foreground"
              }`}
            >
              {p === "week" ? t("সাপ্তাহিক", "Weekly", "أسبوعي") : t("মাসিক", "Monthly", "شهري")}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              interval={period === "month" ? 4 : 0}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              domain={[0, DAILY_AMALS.length]}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(value: number) => [value, t("আমল", "Amals", "أعمال")]}
            />
            <ReferenceLine y={DAILY_AMALS.length} stroke="hsl(var(--accent))" strokeDasharray="3 3" opacity={0.5} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
          <TrendingUp className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground">{totalCompleted}</p>
          <p className="text-[9px] text-muted-foreground">{t("মোট", "Total", "المجموع")}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
          <Calendar className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground">{avgPerDay}</p>
          <p className="text-[9px] text-muted-foreground">{t("গড়/দিন", "Avg/day", "معدل/يوم")}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
          <Star className="w-3.5 h-3.5 text-accent mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground">{bestDay?.count || 0}</p>
          <p className="text-[9px] text-muted-foreground">{t("সেরা দিন", "Best day", "أفضل يوم")}</p>
        </div>
      </div>

      {/* Top Amals */}
      {amalDayCount.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">
            {t("সেরা আমলসমূহ", "Top Amals", "أفضل الأعمال")}
          </p>
          <div className="space-y-1.5">
            {amalDayCount.map(({ id, count }) => (
              <div key={id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-1.5">
                <span className="text-[11px] text-foreground truncate flex-1 mr-2">{getAmalName(id)}</span>
                <span className="text-[10px] font-bold text-accent shrink-0">
                  {count} {t("দিন", "days", "يوم")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
