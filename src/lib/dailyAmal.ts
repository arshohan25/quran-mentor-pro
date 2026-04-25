import { DAILY_AMALS } from "@/data/dailyAmalData";

export const TOTAL_AMALS = DAILY_AMALS.length;

export function todayKey(d: Date = new Date()): string {
  return `daily-amal-${d.toISOString().slice(0, 10)}`;
}

export function getTodayCompleted(): number[] {
  try {
    const raw = localStorage.getItem(todayKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAmalStreak(threshold: number = Math.ceil(TOTAL_AMALS * 0.5)): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const raw = localStorage.getItem(`daily-amal-${d.toISOString().slice(0, 10)}`);
    if (raw) {
      try {
        const ids: number[] = JSON.parse(raw);
        if (ids.length >= threshold) streak++;
        else if (i > 0) break;
      } catch {
        if (i > 0) break;
      }
    } else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
