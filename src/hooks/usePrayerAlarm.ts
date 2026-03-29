import { useState, useEffect, useCallback, useRef } from "react";

type PrayerKey = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

interface AlarmState {
  Fajr: boolean;
  Dhuhr: boolean;
  Asr: boolean;
  Maghrib: boolean;
  Isha: boolean;
}

const STORAGE_KEY = "prayerAlarms";
const LAST_NOTIFIED_KEY = "lastNotifiedPrayer";

const defaultAlarms: AlarmState = {
  Fajr: true,
  Dhuhr: true,
  Asr: true,
  Maghrib: true,
  Isha: true,
};

function getStoredAlarms(): AlarmState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultAlarms, ...JSON.parse(stored) } : defaultAlarms;
  } catch {
    return defaultAlarms;
  }
}

export function usePrayerAlarm(timings: Record<string, string> | any) {
  const [alarms, setAlarms] = useState<AlarmState>(getStoredAlarms);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const lastNotifiedRef = useRef<string>("");

  useEffect(() => {
    try {
      lastNotifiedRef.current = localStorage.getItem(LAST_NOTIFIED_KEY) || "";
    } catch {}
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const toggleAlarm = useCallback((prayer: PrayerKey) => {
    setAlarms((prev) => {
      const next = { ...prev, [prayer]: !prev[prayer] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Check every 30s if current time matches a prayer time
  useEffect(() => {
    if (!timings || permission !== "granted") return;

    const check = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hh}:${mm}`;
      const today = now.toISOString().slice(0, 10);

      const prayerKeys: PrayerKey[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

      for (const key of prayerKeys) {
        if (!alarms[key]) continue;
        const prayerTime = (timings[key] || "").split(" ")[0]; // remove timezone like "(EET)"
        if (!prayerTime) continue;

        const notifId = `${key}-${today}`;
        if (prayerTime === currentTime && lastNotifiedRef.current !== notifId) {
          lastNotifiedRef.current = notifId;
          localStorage.setItem(LAST_NOTIFIED_KEY, notifId);

          const prayerNames: Record<PrayerKey, string> = {
            Fajr: "ফজর", Dhuhr: "যোহর", Asr: "আসর", Maghrib: "মাগরিব", Isha: "এশা",
          };

          new Notification(`🕌 ${prayerNames[key]} নামাজের সময় হয়েছে`, {
            body: `এখন ${prayerNames[key]} নামাজের সময়। আল্লাহু আকবার।`,
            icon: "/placeholder.svg",
            tag: notifId,
          });
        }
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [timings, alarms, permission]);

  return { alarms, toggleAlarm, permission, requestPermission };
}
