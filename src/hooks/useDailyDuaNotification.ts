import { useState, useEffect, useCallback, useRef } from "react";
import { DUAS } from "@/data/duaData";

const ENABLED_KEY = "duaDailyNotif";
const LAST_DATE_KEY = "lastDuaNotifDate";

function getTodaysDuaIndex(): number {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return seed % DUAS.length;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyDuaNotification() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ENABLED_KEY) !== "false";
    } catch {
      return true;
    }
  });

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const sentRef = useRef(false);
  const todaysDua = DUAS[getTodaysDuaIndex()];

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(ENABLED_KEY, String(next));
      return next;
    });
  }, []);

  // Send notification once per day on app load
  useEffect(() => {
    if (!enabled || permission !== "granted" || sentRef.current) return;
    if (typeof Notification === "undefined") return;

    const today = getTodayString();
    const lastSent = localStorage.getItem(LAST_DATE_KEY);

    if (lastSent === today) return;

    sentRef.current = true;
    localStorage.setItem(LAST_DATE_KEY, today);

    const dua = DUAS[getTodaysDuaIndex()];

    new Notification("🤲 আজকের দোয়া", {
      body: dua.bn.slice(0, 120) + (dua.bn.length > 120 ? "..." : ""),
      icon: "/placeholder.svg",
      tag: `daily-dua-${today}`,
    });
  }, [enabled, permission]);

  return { enabled, toggleEnabled, todaysDua, permission, requestPermission };
}
