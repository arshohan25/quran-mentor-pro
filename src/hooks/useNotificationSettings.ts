import { useCallback, useEffect, useState } from "react";

export interface NotificationSettings {
  master: boolean;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  prayerOffsetMin: number; // -15..+15
  dailyAyah: boolean;
  dailyAyahTime: string; // HH:MM
  dailyHadith: boolean;
  dailyHadithTime: string;
  dailyDua: boolean;
  dailyDuaTime: string;
}

const DEFAULTS: NotificationSettings = {
  master: false,
  fajr: true,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
  prayerOffsetMin: 0,
  dailyAyah: true,
  dailyAyahTime: "08:00",
  dailyHadith: true,
  dailyHadithTime: "19:00",
  dailyDua: true,
  dailyDuaTime: "07:30",
};

const KEY = "notification_settings_v1";

function load(): NotificationSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const update = useCallback(<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  return { settings, update };
}
