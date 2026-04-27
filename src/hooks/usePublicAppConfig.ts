import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Branding {
  id: number;
  app_name_bn: string; app_name_en: string; app_name_ar: string;
  tagline_bn: string | null; tagline_en: string | null; tagline_ar: string | null;
  logo_url: string | null;
  primary_hsl: string; accent_hsl: string; gold_hsl: string;
  default_language: "bn" | "en" | "ar";
  default_theme: "light" | "dark" | "auto";
}

export interface HomeSection {
  id: string; key: string; enabled: boolean; sort_order: number;
  title_bn: string | null; title_en: string | null; title_ar: string | null;
  subtitle_bn: string | null; subtitle_en: string | null; subtitle_ar: string | null;
  cta_label_bn: string | null; cta_label_en: string | null; cta_label_ar: string | null;
  link: string | null; icon: string | null;
}

export interface NavItem {
  id: string; enabled: boolean; sort_order: number;
  path: string; icon: string;
  label_bn: string | null; label_en: string | null; label_ar: string | null;
}

export interface ReciterRow {
  id: string; enabled: boolean; sort_order: number;
  name_bn: string | null; name_en: string | null; name_ar: string | null;
  external_id: string | null; is_default: boolean;
}

interface State {
  branding: Branding | null;
  homeSections: HomeSection[];
  navItems: NavItem[];
  reciters: ReciterRow[];
  contentItems: Record<string, { bn?: string | null; en?: string | null; ar?: string | null }>;
  loading: boolean;
}

let cache: State = {
  branding: null, homeSections: [], navItems: [], reciters: [], contentItems: {}, loading: true,
};
const subscribers = new Set<(s: State) => void>();
const notify = () => subscribers.forEach((cb) => cb(cache));

let bootstrapped = false;

async function loadAll() {
  const [b, h, n, r, c] = await Promise.all([
    supabase.from("app_branding").select("*").eq("id", 1).maybeSingle(),
    supabase.from("home_sections").select("*").order("sort_order"),
    supabase.from("nav_items").select("*").order("sort_order"),
    supabase.from("reciters").select("*").order("sort_order"),
    supabase.from("content_items").select("*"),
  ]);
  const itemsMap: State["contentItems"] = {};
  (c.data ?? []).forEach((row: any) => { if (row.enabled) itemsMap[row.key] = { bn: row.bn, en: row.en, ar: row.ar }; });
  cache = {
    branding: (b.data as any) ?? null,
    homeSections: (h.data ?? []) as any,
    navItems: (n.data ?? []) as any,
    reciters: (r.data ?? []) as any,
    contentItems: itemsMap,
    loading: false,
  };
  notify();
}

function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;
  loadAll();
  const ch = supabase.channel("public-config")
    .on("postgres_changes", { event: "*", schema: "public", table: "app_branding" }, loadAll)
    .on("postgres_changes", { event: "*", schema: "public", table: "home_sections" }, loadAll)
    .on("postgres_changes", { event: "*", schema: "public", table: "nav_items" }, loadAll)
    .on("postgres_changes", { event: "*", schema: "public", table: "reciters" }, loadAll)
    .on("postgres_changes", { event: "*", schema: "public", table: "content_items" }, loadAll)
    .subscribe();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void ch;
}

export function usePublicAppConfig(): State & { refresh: () => Promise<void> } {
  const [s, setS] = useState<State>(cache);
  useEffect(() => {
    bootstrap();
    subscribers.add(setS);
    setS(cache);
    return () => { subscribers.delete(setS); };
  }, []);
  return { ...s, refresh: loadAll };
}

export function getDefaultReciterId(): string | null {
  const def = cache.reciters.find((r) => r.is_default && r.enabled);
  return def?.id ?? cache.reciters.find((r) => r.enabled)?.id ?? null;
}
