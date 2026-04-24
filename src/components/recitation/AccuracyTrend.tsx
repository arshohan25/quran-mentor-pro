import { useAccuracyTrend } from "@/hooks/useRecitationStats";
import { Loader2 } from "lucide-react";

export default function AccuracyTrend({ days = 7 }: { days?: number }) {
  const { data, isLoading } = useAccuracyTrend(days);

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;
  }
  if (!data) return null;

  const maxBarHeight = 64; // px
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-1.5 h-20">
        {data.map(d => {
          const acc = Math.round(d.avgAccuracy * 100);
          const height = d.count > 0 ? Math.max(4, (d.avgAccuracy) * maxBarHeight) : 2;
          const barColor = d.count === 0
            ? "bg-muted"
            : acc >= 90 ? "bg-emerald-500"
            : acc >= 70 ? "bg-amber-500"
            : "bg-destructive";
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex justify-center" style={{ height: maxBarHeight }}>
                <div className={`w-full rounded-t ${barColor} transition-all`} style={{ height, alignSelf: "flex-end" }} />
              </div>
              <span className="text-[9px] text-muted-foreground tabular-nums">
                {new Date(d.date).getDate()}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground text-center">Last {days} days · average accuracy</p>
    </div>
  );
}
