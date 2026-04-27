import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Item {
  id: string; key: string; bn: string | null; en: string | null; ar: string | null; enabled: boolean;
}

export default function AdminContentStringsPage() {
  const [rows, setRows] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase.from("content_items").select("*").order("key");
    setRows((data ?? []) as Item[]);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const update = (id: string, patch: Partial<Item>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const add = async () => {
    const key = prompt("New string key (unique, e.g. 'home.welcome')")?.trim();
    if (!key) return;
    const { data, error } = await supabase.from("content_items").insert({ key, en: "", bn: "", ar: "" }).select().single();
    if (error) return toast.error(error.message);
    setRows((rs) => [...rs, data as Item]);
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };
  const saveAll = async () => {
    setSaving(true);
    for (const r of rows) {
      const { id, ...patch } = r;
      const { error } = await supabase.from("content_items").update(patch).eq("id", id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success("Strings updated");
  };

  const filtered = rows.filter((r) => !filter || r.key.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Content Strings</h1>
          <p className="text-sm text-muted-foreground">Edit any labeled text snippet across the app.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Filter by key…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56" />
          <Button variant="outline" onClick={add}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </div>

      {loading ? <Skeleton className="h-64" /> : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground p-6 text-center border rounded-md">No strings yet — add one to get started.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono flex-1">{r.key}</code>
                <Switch checked={r.enabled} onCheckedChange={(v) => update(r.id, { enabled: v })} />
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input placeholder="EN" value={r.en ?? ""} onChange={(e) => update(r.id, { en: e.target.value })} />
                <Input placeholder="BN" value={r.bn ?? ""} onChange={(e) => update(r.id, { bn: e.target.value })} />
                <Input dir="rtl" placeholder="AR" value={r.ar ?? ""} onChange={(e) => update(r.id, { ar: e.target.value })} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save all
        </Button>
      </div>
    </div>
  );
}
