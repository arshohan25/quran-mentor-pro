const STREAK_KEY = "hifz-streak-data";

interface StreakData {
  practiceDates: string[]; // ISO date strings "YYYY-MM-DD"
  totalMinutes: Record<string, number>; // date -> minutes
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : { practiceDates: [], totalMinutes: {} };
  } catch {
    return { practiceDates: [], totalMinutes: {} };
  }
}

function saveStreak(data: StreakData) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

export function logPracticeSession(durationMs: number) {
  const data = loadStreak();
  const today = getToday();
  const minutes = Math.round(durationMs / 60000);

  if (!data.practiceDates.includes(today)) {
    data.practiceDates.push(today);
  }
  data.totalMinutes[today] = (data.totalMinutes[today] || 0) + minutes;
  saveStreak(data);
}

export function getStreakStats() {
  const data = loadStreak();
  const today = getToday();
  const dates = [...new Set(data.practiceDates)].sort().reverse();

  // Current streak
  let currentStreak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split("T")[0];
    if (dates.includes(dateStr)) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      // today not practiced yet, check from yesterday
      d.setDate(d.getDate() - 1);
      continue;
    } else {
      break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = [...dates].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      tempStreak = diff === 1 ? tempStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Last 7 days activity
  const last7Days: { date: string; minutes: number }[] = [];
  const weekDate = new Date();
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(weekDate);
    dt.setDate(dt.getDate() - i);
    const dateStr = dt.toISOString().split("T")[0];
    last7Days.push({ date: dateStr, minutes: data.totalMinutes[dateStr] || 0 });
  }

  const todayMinutes = data.totalMinutes[today] || 0;
  const totalDays = dates.length;

  return { currentStreak, longestStreak, todayMinutes, totalDays, last7Days };
}
