import { useEffect, useMemo, useState } from "react";
import { Save, Loader2, RotateCcw, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AppSettings, DEFAULT_APP_SETTINGS, useAppSettings } from "@/hooks/useAppSettings";
import { usePublicAppConfig } from "@/hooks/usePublicAppConfig";
import {
  HOME_TILE_MANIFEST,
  SECTION_LABELS,
  SECTION_ORDER,
  isTileVisibleIn,
  type HomeTileManifestEntry,
  type HomeTileSection,
} from "@/lib/homeTilesManifest";

const FEATURE_LABELS: Record<keyof AppSettings["features"], string> = {
  ask_ai: "Ask AI",
  live_recitation: "Live Recitation",
  hifz_srs: "Hifz SRS Reviews",
  tafsir_compare: "Tafsir Compare",
  word_meanings: "Word Meanings",
  tajweed: "Tajweed Highlighting",
  audio_player: "Audio Player",
  bookmarks: "Bookmarks",
};

/** Simple boolean UI flags (exclude `tiles`, which is a map rendered separately). */
type SimpleUiKey = Exclude<keyof AppSettings["ui"], "tiles">;
const UI_LABELS: Record<SimpleUiKey, string> = {
  show_streak_chip: "Show streak chip on home",
  show_daily_ayah: "Show Daily Ayah card",
  show_daily_hadith: "Show Daily Hadith card",
  show_daily_dua: "Show Daily Dua card",
  show_qibla_tile: "Show Qibla tile (legacy)",
  show_hijri_tile: "Show Hijri tile (legacy)",
  compact_home: "Use compact home layout",
};

export default function AdminSettingsPage() {
  const { settings: liveSettings, updatedAt, loading: liveLoading } = useAppSettings();
  const { reciters } = usePublicAppConfig();
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("announcement");

  // Keep local draft in sync with live snapshot until user starts editing.
  useEffect(() => {
    if (!liveLoading && draft === null) setDraft(liveSettings);
  }, [liveLoading, liveSettings, draft]);

  const dirty = useMemo(
    () => draft != null && JSON.stringify(draft) !== JSON.stringify(liveSettings),
    [draft, liveSettings],
  );

  if (!draft) return <Skeleton className="h-96" />;

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setDraft({ ...draft, [key]: value });

  const updateNested = <K extends keyof AppSettings, F extends keyof AppSettings[K]>(
    section: K, field: F, value: AppSettings[K][F],
  ) => setDraft({ ...draft, [section]: { ...(draft[section] as any), [field]: value } });

  const resetSection = <K extends keyof AppSettings>(section: K) =>
    setDraft({ ...draft, [section]: DEFAULT_APP_SETTINGS[section] });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ settings: draft as any, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved — pushed live to all users");
  };

  const reciterDisplay = (id: string | null) => {
    if (!id) return "Use reciter table default";
    const r = reciters.find((x) => x.id === id || x.external_id === id);
    return r ? (r.name_en || r.name_bn || r.id) : id;
  };

  return (
    <div className="space-y-6 max-w-4xl pb-32">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">App Settings</h1>
          <p className="text-sm text-muted-foreground">
            Live, app-wide controls. Changes are pushed to every connected user instantly.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="secondary" className="gap-1.5">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Live
          </Badge>
          {updatedAt && (
            <p className="text-[11px] text-muted-foreground">
              Updated {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="announcement">Banner</TabsTrigger>
          <TabsTrigger value="defaults">Defaults</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="ui">UI</TabsTrigger>
        </TabsList>

        {/* Announcement */}
        <TabsContent value="announcement" className="space-y-4">
          <Section title="Announcement Banner" onReset={() => resetSection("announcement")}>
            <Row label="Enabled">
              <Switch
                checked={draft.announcement.enabled}
                onCheckedChange={(v) => updateNested("announcement", "enabled", v)}
              />
            </Row>
            <div className="space-y-2">
              <Label className="text-xs">Message</Label>
              <Textarea
                rows={2}
                value={draft.announcement.text}
                onChange={(e) => updateNested("announcement", "text", e.target.value)}
                placeholder="e.g., Ramadan Mubarak — new tafsir features now live!"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Level</Label>
              <Select
                value={draft.announcement.level}
                onValueChange={(v) => updateNested("announcement", "level", v as any)}
              >
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>
        </TabsContent>

        {/* Defaults */}
        <TabsContent value="defaults" className="space-y-4">
          <Section title="Defaults for new users" onReset={() => resetSection("defaults")}>
            <div className="space-y-2">
              <Label className="text-xs">Default reciter</Label>
              <Select
                value={draft.defaults.default_reciter_id ?? "__table__"}
                onValueChange={(v) =>
                  updateNested("defaults", "default_reciter_id", v === "__table__" ? null : v)
                }
              >
                <SelectTrigger><SelectValue placeholder={reciterDisplay(draft.defaults.default_reciter_id)} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__table__">Use reciter table default</SelectItem>
                  {reciters.filter((r) => r.enabled).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name_en || r.name_bn || r.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                When set, overrides the per-user choice on first launch and the "is_default" flag in the reciter table.
              </p>
            </div>
            <NumField label="Daily minutes goal" value={draft.defaults.daily_minutes_goal}
              min={5} max={120} step={5}
              onChange={(n) => updateNested("defaults", "daily_minutes_goal", n)} />
            <div className="space-y-2">
              <Label className="text-xs">Default translation key</Label>
              <Input
                value={draft.defaults.default_translation}
                onChange={(e) => updateNested("defaults", "default_translation", e.target.value)}
                placeholder="bn.bengali"
              />
            </div>
            <NumField label="Default Arabic font size (px)" value={draft.defaults.default_arabic_font_size}
              min={16} max={64} step={2}
              onChange={(n) => updateNested("defaults", "default_arabic_font_size", n)} />
          </Section>
        </TabsContent>

        {/* Limits */}
        <TabsContent value="limits" className="space-y-4">
          <Section title="Practice & live recitation limits" onReset={() => resetSection("limits")}>
            <NumField label="Practice session max length (seconds)" value={draft.limits.practice_max_seconds}
              min={30} max={3600} step={30}
              onChange={(n) => updateNested("limits", "practice_max_seconds", n)} />
            <NumField label="Live recitation max length (seconds)" value={draft.limits.live_max_seconds}
              min={30} max={3600} step={30}
              onChange={(n) => updateNested("limits", "live_max_seconds", n)} />
            <NumField label="Minimum accuracy % to save a live session" value={draft.limits.live_min_accuracy_to_save}
              min={0} max={100} step={5}
              onChange={(n) => updateNested("limits", "live_min_accuracy_to_save", n)} />
            <NumField label="Hifz daily review cap (cards)" value={draft.limits.hifz_daily_review_cap}
              min={5} max={500} step={5}
              onChange={(n) => updateNested("limits", "hifz_daily_review_cap", n)} />
            <NumField label="Ask AI daily quota per user" value={draft.limits.ask_ai_daily_quota}
              min={0} max={500} step={1}
              onChange={(n) => updateNested("limits", "ask_ai_daily_quota", n)} />
          </Section>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="space-y-4">
          <Section title="Feature flags" onReset={() => resetSection("features")}>
            {(Object.keys(FEATURE_LABELS) as (keyof AppSettings["features"])[]).map((k) => (
              <Row key={k} label={FEATURE_LABELS[k]}>
                <Switch
                  checked={draft.features[k]}
                  onCheckedChange={(v) => updateNested("features", k, v)}
                />
              </Row>
            ))}
          </Section>
        </TabsContent>

        {/* UI Toggles */}
        <TabsContent value="ui" className="space-y-4">
          <Section title="Home & UI toggles" onReset={() => resetSection("ui")}>
            {(Object.keys(UI_LABELS) as SimpleUiKey[]).map((k) => (
              <Row key={k} label={UI_LABELS[k]}>
                <Switch
                  checked={draft.ui[k]}
                  onCheckedChange={(v) => updateNested("ui", k, v)}
                />
              </Row>
            ))}
          </Section>

          <Section title="Home tiles & cards (per-item visibility)">
            <p className="text-xs text-muted-foreground -mt-1 mb-2">
              Toggle off to hide an item from every user's home page. Changes push live instantly.
            </p>
            {SECTION_ORDER.map((section) => {
              const items = HOME_TILE_MANIFEST.filter((m) => m.section === section);
              if (items.length === 0) return null;
              const tilesMap = draft.ui.tiles ?? {};
              const allOn = items.every((it) => isTileVisibleIn(tilesMap, it.path));
              const setAll = (on: boolean) => {
                const next = { ...tilesMap };
                items.forEach((it) => { next[it.path] = on; });
                updateNested("ui", "tiles", next);
              };
              return (
                <div key={section} className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {SECTION_LABELS[section as HomeTileSection]}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setAll(!allOn)}
                    >
                      {allOn ? "Hide all" : "Show all"}
                    </Button>
                  </div>
                  {items.map((it) => (
                    <Row key={it.path} label={`${it.label}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/70 font-mono">
                          {it.path}
                        </span>
                        <Switch
                          checked={isTileVisibleIn(tilesMap, it.path)}
                          onCheckedChange={(v) => {
                            const next = { ...tilesMap, [it.path]: v };
                            updateNested("ui", "tiles", next);
                          }}
                        />
                      </div>
                    </Row>
                  ))}
                </div>
              );
            })}
          </Section>

          <TileAuditSection
            tiles={draft.ui.tiles ?? {}}
            onClearKeys={(paths) => {
              const next = { ...(draft.ui.tiles ?? {}) };
              paths.forEach((p) => { delete next[p]; });
              updateNested("ui", "tiles", next);
            }}
          />
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-4 right-4 left-4 sm:left-auto flex justify-end gap-2 bg-background/80 backdrop-blur p-3 rounded-2xl border shadow-lg z-50 sm:max-w-sm">
        <Button
          variant="outline"
          onClick={() => setDraft(liveSettings)}
          disabled={!dirty || saving}
        >
          Discard
        </Button>
        <Button onClick={save} disabled={!dirty || saving} size="lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {dirty ? "Save & push live" : "All saved"}
        </Button>
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */

function Section({ title, onReset, children }: { title: string; onReset?: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
            <RotateCcw className="w-3 h-3 mr-1" /> Reset section
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function NumField({ label, value, min, max, step, onChange }:
  { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number" min={min} max={max} step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="w-40"
      />
    </div>
  );
}
