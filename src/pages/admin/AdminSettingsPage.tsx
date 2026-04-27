import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Settings {
  announcement: { enabled: boolean; text: string; level: "info" | "warn" | "success" };
  features: {
    ask_ai: boolean;
    live_recitation: boolean;
    hifz_srs: boolean;
    tafsir_compare: boolean;
  };
  defaults: { daily_minutes_goal: number };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("settings")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setSettings((data?.settings as unknown as Settings) ?? null);
        setLoading(false);
      });
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ settings: settings as any, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Settings saved");
  };

  if (loading || !settings) return <Skeleton className="h-96" />;

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings({ ...settings, [key]: value });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">App Settings</h1>
        <p className="text-sm text-muted-foreground">Global feature flags and announcements.</p>
      </div>

      {/* Announcement banner */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Announcement Banner</h3>
            <p className="text-xs text-muted-foreground">Shown on the home page when enabled.</p>
          </div>
          <Switch
            checked={settings.announcement.enabled}
            onCheckedChange={(v) =>
              update("announcement", { ...settings.announcement, enabled: v })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Message</Label>
          <Textarea
            rows={2}
            value={settings.announcement.text}
            onChange={(e) =>
              update("announcement", { ...settings.announcement, text: e.target.value })
            }
            placeholder="e.g., Ramadan Mubarak — new tafsir features now live!"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Level</Label>
          <Select
            value={settings.announcement.level}
            onValueChange={(v) =>
              update("announcement", { ...settings.announcement, level: v as any })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Feature flags */}
      <section className="rounded-xl border bg-card p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Feature Flags</h3>
          <p className="text-xs text-muted-foreground">Toggle features for all users.</p>
        </div>
        {(Object.keys(settings.features) as (keyof Settings["features"])[]).map((key) => (
          <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
            <Label className="text-sm capitalize">{key.replace(/_/g, " ")}</Label>
            <Switch
              checked={settings.features[key]}
              onCheckedChange={(v) => update("features", { ...settings.features, [key]: v })}
            />
          </div>
        ))}
      </section>

      {/* Defaults */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Defaults</h3>
          <p className="text-xs text-muted-foreground">Initial values for new users.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Daily minutes goal</Label>
          <Input
            type="number"
            min={5}
            max={120}
            step={5}
            value={settings.defaults.daily_minutes_goal}
            onChange={(e) =>
              update("defaults", {
                ...settings.defaults,
                daily_minutes_goal: parseInt(e.target.value, 10) || 20,
              })
            }
            className="w-32"
          />
        </div>
      </section>

      <div className="flex justify-end sticky bottom-4">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
