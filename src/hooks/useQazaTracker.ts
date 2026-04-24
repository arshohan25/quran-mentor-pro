import { useCallback, useEffect, useState } from "react";

export type Waqt = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha" | "witr";
export const WAQTS: Waqt[] = ["fajr", "dhuhr", "asr", "maghrib", "isha", "witr"];

export interface QazaCounts {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
}

export interface QazaState {
  initial: QazaCounts;
  completed: QazaCounts;
  dailyLog: Record<string, Partial<QazaCounts>>; // ISO date -> counts
  setupAt: number | null;
}

const STORAGE_KEY = "qaza_state_v1";
const ZERO: QazaCounts = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 };

const DEFAULT: QazaState = {
  initial: { ...ZERO },
  completed: { ...ZERO },
  dailyLog: {},
  setupAt: null,
};

function load(): QazaState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      initial: { ...ZERO, ...(parsed.initial || {}) },
      completed: { ...ZERO, ...(parsed.completed || {}) },
      dailyLog: parsed.dailyLog || {},
      setupAt: parsed.setupAt ?? null,
    };
  } catch {
    return DEFAULT;
  }
}

function save(s: QazaState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useQazaTracker() {
  const [state, setState] = useState<QazaState>(load);

  useEffect(() => save(state), [state]);

  const isSetup = state.setupAt !== null;

  const setupInitial = useCallback((initial: QazaCounts) => {
    setState({ initial, completed: { ...ZERO }, dailyLog: {}, setupAt: Date.now() });
  }, []);

  const updateInitial = useCallback((initial: QazaCounts) => {
    setState((s) => ({ ...s, initial }));
  }, []);

  const logMakeup = useCallback((waqt: Waqt, count = 1) => {
    setState((s) => {
      const remaining = Math.max(0, s.initial[waqt] - s.completed[waqt]);
      const inc = Math.max(0, Math.min(count, remaining));
      if (inc === 0) return s;
      const date = todayISO();
      const todayLog = s.dailyLog[date] || {};
      return {
        ...s,
        completed: { ...s.completed, [waqt]: s.completed[waqt] + inc },
        dailyLog: {
          ...s.dailyLog,
          [date]: { ...todayLog, [waqt]: (todayLog[waqt] || 0) + inc },
        },
      };
    });
  }, []);

  const undoToday = useCallback((waqt: Waqt) => {
    setState((s) => {
      const date = todayISO();
      const todayLog = s.dailyLog[date] || {};
      const todayCount = todayLog[waqt] || 0;
      if (todayCount === 0) return s;
      const newToday = { ...todayLog, [waqt]: todayCount - 1 };
      return {
        ...s,
        completed: { ...s.completed, [waqt]: Math.max(0, s.completed[waqt] - 1) },
        dailyLog: { ...s.dailyLog, [date]: newToday },
      };
    });
  }, []);

  const reset = useCallback(() => setState(DEFAULT), []);

  // Derived
  const remaining: QazaCounts = WAQTS.reduce((acc, w) => {
    acc[w] = Math.max(0, state.initial[w] - state.completed[w]);
    return acc;
  }, { ...ZERO });

  const totalInitial = WAQTS.reduce((s, w) => s + state.initial[w], 0);
  const totalCompleted = WAQTS.reduce((s, w) => s + state.completed[w], 0);
  const totalRemaining = totalInitial - totalCompleted;
  const overallPct = totalInitial > 0 ? Math.round((totalCompleted / totalInitial) * 100) : 0;

  // Streak: consecutive days (ending today) with at least one log
  const streak = (() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      const log = state.dailyLog[key] || {};
      const sum = WAQTS.reduce((s, w) => s + (log[w] || 0), 0);
      if (sum > 0) count++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  // Last 30 days chart data
  const chartData = (() => {
    const arr: { date: string; count: number }[] = [];
    const d = new Date();
    d.setDate(d.getDate() - 29);
    for (let i = 0; i < 30; i++) {
      const key = d.toISOString().slice(0, 10);
      const log = state.dailyLog[key] || {};
      const sum = WAQTS.reduce((s, w) => s + (log[w] || 0), 0);
      arr.push({ date: key.slice(5), count: sum });
      d.setDate(d.getDate() + 1);
    }
    return arr;
  })();

  return {
    state,
    isSetup,
    remaining,
    totalInitial,
    totalCompleted,
    totalRemaining,
    overallPct,
    streak,
    chartData,
    setupInitial,
    updateInitial,
    logMakeup,
    undoToday,
    reset,
  };
}
