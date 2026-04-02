import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DAILY_AMALS } from "@/data/dailyAmalData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { BarChart3, TrendingUp, Star, Calendar, Grid3X3 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

      {/* Annual Heatmap */}
      <AnnualHeatmap />
    </div>
  );
}

function AnnualHeatmap() {
  const { t } = useLanguage();

  const heatmapData = useMemo(() => {
    const cells: { date: string; count: number; dayOfWeek: number; weekIndex: number }[] = [];
    const today = new Date();
    // Go back ~52 weeks to the nearest Saturday
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    // Adjust to Saturday
    const startDay = start.getDay();
    const satOffset = (startDay + 1) % 7; // days since Saturday
    start.setDate(start.getDate() - satOffset);

    const totalDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    for (let i = 0; i < totalDays; i++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      if (dt > today) break;
      const key = dt.toISOString().slice(0, 10);
      let count = 0;
      try {
        const raw = localStorage.getItem(`daily-amal-${key}`);
        if (raw) count = JSON.parse(raw).length;
      } catch {}
      cells.push({
        date: key,
        count,
        dayOfWeek: dt.getDay(), // 0=Sun
        weekIndex: Math.floor(i / 7),
      });
    }
    return cells;
  }, []);

  // Group by weekIndex
  const weeks = useMemo(() => {
    const map: Record<number, typeof heatmapData> = {};
    heatmapData.forEach((c) => {
      if (!map[c.weekIndex]) map[c.weekIndex] = [];
      map[c.weekIndex].push(c);
    });
    return Object.keys(map)
      .map(Number)
      .sort((a, b) => a - b)
      .map((wi) => map[wi]);
  }, [heatmapData]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    heatmapData.forEach((c) => {
      const m = new Date(c.date).getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        labels.push({ label: monthNames[m], weekIndex: c.weekIndex });
      }
    });
    return labels;
  }, [heatmapData]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-secondary/40";
    if (count <= 5) return "bg-primary/25";
    if (count <= 12) return "bg-primary/50";
    if (count <= 19) return "bg-primary/75";
    return "bg-primary";
  };

  const cellSize = 10;
  const gap = 2;
  const totalWidth = weeks.length * (cellSize + gap);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Grid3X3 className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-semibold text-foreground">
          {t("বার্ষিক আমল ট্র্যাকার", "Annual Amal Tracker", "تتبع الأعمال السنوي")}
        </span>
      </div>

      <ScrollArea className="w-full">
        <div style={{ width: totalWidth + 20 }} className="pb-2">
          {/* Month labels */}
          <div className="flex relative" style={{ height: 14, marginLeft: 0 }}>
            {monthLabels.map((ml, i) => (
              <span
                key={i}
                className="text-[8px] text-muted-foreground absolute"
                style={{ left: ml.weekIndex * (cellSize + gap) }}
              >
                {ml.label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const cell = week.find((c) => c.dayOfWeek === dayIdx);
                  if (!cell) return <div key={dayIdx} style={{ width: cellSize, height: cellSize }} />;
                  return (
                    <div
                      key={dayIdx}
                      className={`rounded-[2px] ${getColor(cell.count)}`}
                      style={{ width: cellSize, height: cellSize }}
                      title={`${cell.date}: ${cell.count}/${DAILY_AMALS.length}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 text-[8px] text-muted-foreground">
        <span>{t("কম", "Less", "أقل")}</span>
        <div className="w-2.5 h-2.5 rounded-[2px] bg-secondary/40" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/25" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/50" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/75" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary" />
        <span>{t("বেশি", "More", "أكثر")}</span>
      </div>
    </div>
  );
}
