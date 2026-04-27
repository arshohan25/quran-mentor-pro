import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  announcement: { enabled: boolean; text: string; level: "info" | "warn" | "success" };
  features: {
    ask_ai: boolean;
    live_recitation: boolean;
    hifz_srs: boolean;
    tafsir_compare: boolean;
    word_meanings: boolean;
    tajweed: boolean;
    audio_player: boolean;
    bookmarks: boolean;
  };
  defaults: {
    daily_minutes_goal: number;
    default_reciter_id: string | null;
    default_translation: string;
    default_arabic_font_size: number;
  };
  limits: {
    practice_max_seconds: number;
    live_max_seconds: number;
    live_min_accuracy_to_save: number;
    hifz_daily_review_cap: number;
    ask_ai_daily_quota: number;
  };
  ui: {
    show_streak_chip: boolean;
    show_daily_ayah: boolean;
    show_daily_hadith: boolean;
    show_daily_dua: boolean;
    show_qibla_tile: boolean;
    show_hijri_tile: boolean;
    compact_home: boolean;
  };
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  announcement: { enabled: false, text: "", level: "info" },
  features: {
    ask_ai: true, live_recitation: true, hifz_srs: true, tafsir_compare: true,
    word_meanings: true, tajweed: true, audio_player: true, bookmarks: true,
  },
  defaults: {
    daily_minutes_goal: 20,
    default_reciter_id: null,
    default_translation: "bn.bengali",
    default_arabic_font_size: 28,
  },
  limits: {
    practice_max_seconds: 300,
    live_max_seconds: 600,
    live_min_accuracy_to_save: 0,
    hifz_daily_review_cap: 50,
    ask_ai_daily_quota: 20,
  },
  ui: {
    show_streak_chip: true,
    show_daily_ayah: true,
    show_daily_hadith: true,
    show_daily_dua: true,
    show_qibla_tile: true,
    show_hijri_tile: true,
    compact_home: false,
  },
};

interface CacheState {
  settings: AppSettings;
  updatedAt: string | null;
  loading: boolean;
}

let cache: CacheState = {
  settings: DEFAULT_APP_SETTINGS,
  updatedAt: null,
  loading: true,
};
const subs = new Set<(s: CacheState) => void>();
const notify = () => subs.forEach((cb) => cb(cache));

let bootstrapped = false;

/** Deep-merge defaults with whatever the DB returned so missing keys never crash callers. */
function merge(raw: any): AppSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_APP_SETTINGS;
  const out: any = { ...DEFAULT_APP_SETTINGS };
  for (const k of Object.keys(DEFAULT_APP_SETTINGS) as (keyof AppSettings)[]) {
    out[k] = { ...(DEFAULT_APP_SETTINGS as any)[k], ...((raw as any)[k] ?? {}) };
  }
  return out as AppSettings;
}

async function load() {
  const { data } = await supabase
    .from("app_settings")
    .select("settings, updated_at")
    .eq("id", 1)
    .maybeSingle();
  cache = {
    settings: merge((data as any)?.settings),
    updatedAt: (data as any)?.updated_at ?? null,
    loading: false,
  };
  notify();
}

function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;
  load();
  supabase
    .channel("app-settings-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, load)
    .subscribe();
}

export function useAppSettings() {
  const [s, setS] = useState<CacheState>(cache);
  useEffect(() => {
    bootstrap();
    subs.add(setS);
    setS(cache);
    return () => { subs.delete(setS); };
  }, []);
  return { ...s, refresh: load };
}

export function useFeatureFlag(key: keyof AppSettings["features"]): boolean {
  const { settings } = useAppSettings();
  return !!settings.features[key];
}

export function useUiToggle(key: keyof AppSettings["ui"]): boolean {
  const { settings } = useAppSettings();
  return !!settings.ui[key];
}

export function useLimit(key: keyof AppSettings["limits"]): number {
  const { settings } = useAppSettings();
  return Number(settings.limits[key] ?? 0);
}

/** Synchronous, non-reactive snapshot — for non-React code paths. */
export function getAppSettingsSnapshot(): AppSettings {
  return cache.settings;
}
