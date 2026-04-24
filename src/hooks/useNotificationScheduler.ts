import { useEffect, useRef } from "react";
import { useNotificationSettings } from "./useNotificationSettings";
import { usePrayerTimes } from "./usePrayerTimes";
import { surahList } from "@/data/surahList";
import { DUAS } from "@/data/duaData";

const SENT_KEY = "notif_sent_marks_v1";

type SentMap = Record<string, number>; // marker -> ts

function loadSent(): SentMap {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveSent(m: SentMap) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(m));
  } catch {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function parseHHMM(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n) || 0);
  return { h: h || 0, m: m || 0 };
}

function nextDateAt(h: number, m: number, offsetMin = 0): Date {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(h, m + offsetMin, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

function fire(title: string, body: string, tag: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body: body.slice(0, 180), icon: "/placeholder.svg", tag });
  } catch (e) {
    console.error("notification fire failed", e);
  }
}

export function useNotificationScheduler() {
  const { settings } = useNotificationSettings();
  const { data: prayerTimings } = usePrayerTimes();
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    // Clear existing timers
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    if (!settings.master) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const schedule = (when: Date, marker: string, title: string, body: string) => {
      const ms = when.getTime() - Date.now();
      if (ms < 0 || ms > 26 * 60 * 60 * 1000) return; // skip if past or too far
      const sent = loadSent();
      if (sent[marker] && Date.now() - sent[marker] < 23 * 60 * 60 * 1000) return; // already fired
      const id = window.setTimeout(() => {
        fire(title, body, marker);
        const m = loadSent();
        m[marker] = Date.now();
        // GC entries older than 3 days
        const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
        Object.keys(m).forEach((k) => m[k] < cutoff && delete m[k]);
        saveSent(m);
      }, ms);
      timersRef.current.push(id);
    };

    const dKey = todayKey();

    // Prayer adhans
    if (prayerTimings) {
      const map: { key: keyof typeof prayerTimings; flag: keyof typeof settings; bn: string; en: string }[] = [
        { key: "Fajr", flag: "fajr", bn: "ফজর", en: "Fajr" },
        { key: "Dhuhr", flag: "dhuhr", bn: "যোহর", en: "Dhuhr" },
        { key: "Asr", flag: "asr", bn: "আসর", en: "Asr" },
        { key: "Maghrib", flag: "maghrib", bn: "মাগরিব", en: "Maghrib" },
        { key: "Isha", flag: "isha", bn: "ইশা", en: "Isha" },
      ];
      map.forEach(({ key, flag, bn, en }) => {
        if (!settings[flag]) return;
        const time = prayerTimings[key];
        if (!time) return;
        const [hStr, mStr] = String(time).split(" ")[0].split(":");
        const h = parseInt(hStr), m = parseInt(mStr);
        if (Number.isNaN(h) || Number.isNaN(m)) return;
        const when = nextDateAt(h, m, settings.prayerOffsetMin);
        schedule(when, `prayer-${flag}-${dKey}`, `🕌 ${bn} (${en})`, `${bn} নামাজের সময় হয়েছে।`);
      });
    }

    // Daily ayah
    if (settings.dailyAyah) {
      const { h, m } = parseHHMM(settings.dailyAyahTime);
      const when = nextDateAt(h, m);
      const seed = new Date().getDate() + new Date().getMonth() * 31;
      const surah = surahList[seed % surahList.length];
      schedule(
        when,
        `ayah-${dKey}`,
        "📖 আজকের আয়াত",
        `${surah.bengaliName} (${surah.englishName}) — সূরা ${surah.number}, আয়াত ১। তিলাওয়াত করতে অ্যাপে যান।`,
      );
    }

    // Daily hadith
    if (settings.dailyHadith) {
      const { h, m } = parseHHMM(settings.dailyHadithTime);
      const when = nextDateAt(h, m);
      schedule(when, `hadith-${dKey}`, "📜 আজকের হাদীস", "আজকের হাদীস পড়তে অ্যাপ খুলুন।");
    }

    // Daily dua
    if (settings.dailyDua) {
      const { h, m } = parseHHMM(settings.dailyDuaTime);
      const when = nextDateAt(h, m);
      const dua = DUAS[(new Date().getDate()) % DUAS.length];
      schedule(when, `dua-${dKey}`, "🤲 আজকের দোয়া", dua?.bn || "আজকের দোয়া দেখুন।");
    }

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [settings, prayerTimings]);
}
