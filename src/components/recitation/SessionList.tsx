import { useRecentSessions } from "@/hooks/useRecitationStats";
import { surahList } from "@/data/surahList";
import { Loader2 } from "lucide-react";

interface Props {
  onSelect?: (surah: number, ayah: number) => void;
  limit?: number;
}

function surahName(n: number) {
  return surahList.find(s => s.number === n)?.englishName ?? `Surah ${n}`;
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function SessionList({ onSelect, limit = 15 }: Props) {
  const { data, isLoading } = useRecentSessions(limit);

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;
  }
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No recitation sessions yet. Start reciting from the Quran or Hifz page.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {data.map(s => {
        const acc = Math.round(s.accuracy * 100);
        const accClass =
          acc >= 90 ? "text-emerald-600 dark:text-emerald-400"
          : acc >= 70 ? "text-amber-600 dark:text-amber-400"
          : "text-destructive";
        return (
          <li key={s.id}>
            <button
              onClick={() => onSelect?.(s.surah, s.ayah)}
              className="w-full text-left py-2.5 px-2 hover:bg-muted/50 rounded transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{surahName(s.surah)} · Ayah {s.ayah}</div>
                <div className="text-[11px] text-muted-foreground">
                  {s.correct_words}/{s.total_words} words · {timeAgo(s.created_at)}
                </div>
              </div>
              <div className={`text-sm font-semibold tabular-nums ${accClass}`}>{acc}%</div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
