import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Kind = "ayah" | "hadith" | "dua";

interface Override {
  id: string; kind: Kind; date: string; enabled: boolean; payload: any;
}

const PAYLOAD_FIELDS: Record<Kind, string[]> = {
  ayah: ["arabic", "bn", "en", "reference"],
  hadith: ["arabic", "bn", "en", "narrator", "reference"],
  dua: ["arabic", "bn", "en", "transliteration", "reference"],
};

export default function AdminDailyContentPage() {
  const [kind, setKind] = useState<Kind>("ayah");
  const [rows, setRows] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_content_overrides")
      .select("*")
      .eq("kind", kind)
      .order("date", { ascending: false })
      .limit(60);
    setRows((data ?? []) as Override[]);
    setLoading(false);
  };
  useEffect(() => { reload(); }, [kind]);

  const update = (id: string, patch: Partial<Override>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const updatePayload = (id: string, key: string, value: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, payload: { ...r.payload, [key]: value } } : r)));

  const add = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("daily_content_overrides")
      .insert({ kind, date: today, payload: {} })
      .select().single();
    if (error) return toast.error(error.message);
    setRows((rs) => [data as Override, ...rs]);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("daily_content_overrides").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const saveAll = async () => {
    setSaving(true);
    for (const r of rows) {
      const { error } = await supabase.from("daily_content_overrides")
        .update({ date: r.date, enabled: r.enabled, payload: r.payload }).eq("id", r.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success("Saved");
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Daily Content</h1>
        <p className="text-sm text-muted-foreground">Curate the Ayah, Hadith and Dua shown to users on a given date.</p>
      </div>

      <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
        <TabsList>
          <TabsTrigger value="ayah">Ayah</TabsTrigger>
          <TabsTrigger value="hadith">Hadith</TabsTrigger>
          <TabsTrigger value="dua">Dua</TabsTrigger>
        </TabsList>

        <TabsContent value={kind} className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={add}><Plus className="w-4 h-4 mr-1" /> Add for today</Button>
          </div>
          {loading ? <Skeleton className="h-64" /> : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center border rounded-md">No overrides yet.</p>
          ) : rows.map((r) => (
            <Card key={r.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Input type="date" className="w-44" value={r.date}
                  onChange={(e) => update(r.id, { date: e.target.value })} />
                <Switch checked={r.enabled} onCheckedChange={(v) => update(r.id, { enabled: v })} />
                <span className="text-xs text-muted-foreground flex-1">{r.enabled ? "Live" : "Disabled"}</span>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {PAYLOAD_FIELDS[kind].map((k) => (
                  <div key={k} className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k}</label>
                    <Textarea rows={k === "arabic" ? 3 : 2} dir={k === "arabic" ? "rtl" : "ltr"}
                      value={r.payload?.[k] ?? ""} onChange={(e) => updatePayload(r.id, k, e.target.value)} />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save all
        </Button>
      </div>
    </div>
  );
}
