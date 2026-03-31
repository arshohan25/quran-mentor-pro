import { useState, useEffect, useCallback } from "react";

const TARGET_KEY = "quran-reading-target";
const READING_LOG_KEY = "quran-reading-log";
const BADGES_KEY = "quran-badges";

export interface DailyTarget {
  pagesPerDay: number;
  startDate: string;
}

export interface ReadingLog {
  [date: string]: {
    pagesRead: number;
    ayahsRead: number;
    minutesSpent: number;
  };
}

export interface Badge {
  id: string;
  name: string;
  nameBn: string;
  nameAr: string;
  description: string;
  descBn: string;
  descAr: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

const BADGE_DEFINITIONS: Omit<Badge, "earned" | "earnedDate">[] = [
  { id: "first_read", name: "First Step", nameBn: "প্রথম পদক্ষেপ", nameAr: "الخطوة الأولى", description: "Read your first page", descBn: "প্রথম পৃষ্ঠা পড়ুন", descAr: "اقرأ صفحتك الأولى", icon: "🌱" },
  { id: "streak_3", name: "3 Day Streak", nameBn: "৩ দিনের ধারা", nameAr: "سلسلة ٣ أيام", description: "Read 3 days in a row", descBn: "টানা ৩ দিন পড়ুন", descAr: "اقرأ ٣ أيام متتالية", icon: "🔥" },
  { id: "streak_7", name: "Weekly Warrior", nameBn: "সাপ্তাহিক যোদ্ধা", nameAr: "محارب أسبوعي", description: "7 day streak", descBn: "৭ দিনের ধারা", descAr: "سلسلة ٧ أيام", icon: "⭐" },
  { id: "streak_30", name: "Monthly Master", nameBn: "মাসিক মাস্টার", nameAr: "سيد شهري", description: "30 day streak", descBn: "৩০ দিনের ধারা", descAr: "سلسلة ٣٠ يوم", icon: "🏆" },
  { id: "pages_10", name: "10 Pages", nameBn: "১০ পৃষ্ঠা", nameAr: "١٠ صفحات", description: "Read 10 total pages", descBn: "মোট ১০ পৃষ্ঠা পড়ুন", descAr: "اقرأ ١٠ صفحات", icon: "📖" },
  { id: "pages_100", name: "Century Reader", nameBn: "শতক পাঠক", nameAr: "قارئ المئة", description: "Read 100 pages", descBn: "১০০ পৃষ্ঠা পড়ুন", descAr: "اقرأ ١٠٠ صفحة", icon: "💎" },
  { id: "khatmah", name: "Khatmah Complete", nameBn: "খতম সম্পন্ন", nameAr: "ختمة كاملة", description: "Complete the Quran", descBn: "কুরআন খতম করুন", descAr: "أكمل القرآن", icon: "🌙" },
];

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function loadTarget(): DailyTarget {
  try {
    const raw = localStorage.getItem(TARGET_KEY);
    return raw ? JSON.parse(raw) : { pagesPerDay: 2, startDate: getToday() };
  } catch {
    return { pagesPerDay: 2, startDate: getToday() };
  }
}

function loadLog(): ReadingLog {
  try {
    const raw = localStorage.getItem(READING_LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadBadges(): Badge[] {
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return BADGE_DEFINITIONS.map((b) => ({ ...b, earned: false }));
}

export function useReadingTarget() {
  const [target, setTargetState] = useState<DailyTarget>(loadTarget);
  const [log, setLogState] = useState<ReadingLog>(loadLog);
  const [badges, setBadgesState] = useState<Badge[]>(loadBadges);

  useEffect(() => {
    localStorage.setItem(TARGET_KEY, JSON.stringify(target));
  }, [target]);

  useEffect(() => {
    localStorage.setItem(READING_LOG_KEY, JSON.stringify(log));
  }, [log]);

  useEffect(() => {
    localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
  }, [badges]);

  const setTarget = useCallback((pagesPerDay: number) => {
    setTargetState({ pagesPerDay, startDate: getToday() });
  }, []);

  const logReading = useCallback((pages: number, ayahs: number = 0, minutes: number = 0) => {
    const today = getToday();
    setLogState((prev) => {
      const existing = prev[today] || { pagesRead: 0, ayahsRead: 0, minutesSpent: 0 };
      return {
        ...prev,
        [today]: {
          pagesRead: existing.pagesRead + pages,
          ayahsRead: existing.ayahsRead + ayahs,
          minutesSpent: existing.minutesSpent + minutes,
        },
      };
    });
  }, []);

  // Compute streak
  const today = getToday();
  const todayLog = log[today] || { pagesRead: 0, ayahsRead: 0, minutesSpent: 0 };
  const todayProgress = Math.min(100, (todayLog.pagesRead / target.pagesPerDay) * 100);

  let currentStreak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split("T")[0];
    if (log[dateStr] && log[dateStr].pagesRead > 0) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      d.setDate(d.getDate() - 1);
      continue;
    } else {
      break;
    }
  }

  const totalPages = Object.values(log).reduce((sum, l) => sum + l.pagesRead, 0);
  const totalDays = Object.keys(log).filter((k) => log[k].pagesRead > 0).length;

  // Check badges
  const checkBadges = useCallback(() => {
    setBadgesState((prev) => {
      const updated = [...prev];
      const earn = (id: string) => {
        const badge = updated.find((b) => b.id === id);
        if (badge && !badge.earned) {
          badge.earned = true;
          badge.earnedDate = getToday();
        }
      };

      if (totalPages >= 1) earn("first_read");
      if (totalPages >= 10) earn("pages_10");
      if (totalPages >= 100) earn("pages_100");
      if (totalPages >= 604) earn("khatmah");
      if (currentStreak >= 3) earn("streak_3");
      if (currentStreak >= 7) earn("streak_7");
      if (currentStreak >= 30) earn("streak_30");

      return updated;
    });
  }, [totalPages, currentStreak]);

  useEffect(() => {
    checkBadges();
  }, [checkBadges]);

  // Last 7 days
  const last7Days: { date: string; pages: number }[] = [];
  const weekDate = new Date();
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(weekDate);
    dt.setDate(dt.getDate() - i);
    const dateStr = dt.toISOString().split("T")[0];
    last7Days.push({ date: dateStr, pages: log[dateStr]?.pagesRead || 0 });
  }

  return {
    target,
    setTarget,
    logReading,
    todayLog,
    todayProgress,
    currentStreak,
    totalPages,
    totalDays,
    badges,
    last7Days,
  };
}
