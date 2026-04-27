import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_ROUTES } from "@/lib/routeManifest";
import { toast } from "sonner";

interface NavRow {
  id: string; enabled: boolean; sort_order: number;
  path: string; icon: string;
  label_bn: string | null; label_en: string | null; label_ar: string | null;
}

export default function AdminNavPage() {
  const [rows, setRows] = useState<NavRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("nav_items").select("*").order("sort_order");
    if (error) toast.error(error.message);
    setRows((data ?? []) as NavRow[]);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const enabledCount = rows.filter((r) => r.enabled).length;

  const update = (id: string, patch: Partial<NavRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const move = (id: string, dir: -1 | 1) => {
    const idx = rows.findIndex((r) => r.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[idx], next[j]] = [next[j], next[idx]];
    next.forEach((r, i) => (r.sort_order = (i + 1) * 10));
    setRows(next);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("nav_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const add = async () => {
    const { data, error } = await supabase.from("nav_items")
      .insert({ path: "/", icon: "Home", label_en: "New", sort_order: (rows.at(-1)?.sort_order ?? 0) + 10 })
      .select().single();
    if (error) return toast.error(error.message);
    setRows((rs) => [...rs, data as NavRow]);
  };

  const saveAll = async () => {
    if (enabledCount > 5) return toast.error("Bottom nav supports max 5 enabled items");
    setSaving(true);
    for (const r of rows) {
      const { id, ...patch } = r;
      const { error } = await supabase.from("nav_items").update(patch).eq("id", id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success("Navigation updated for all users");
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bottom Navigation</h1>
          <p className="text-sm text-muted-foreground">Edit the bottom nav. {enabledCount}/5 enabled.</p>
        </div>
        <Button variant="outline" onClick={add}><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>

      {enabledCount > 5 && (
        <div className="flex items-center gap-2 text-sm rounded-md border border-destructive/40 bg-destructive/10 p-2 text-destructive">
          <AlertTriangle className="w-4 h-4" /> Disable some items — only 5 may be enabled.
        </div>
      )}

      <div className="space-y-3">
        {rows.map((r, i) => (
          <Card key={r.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <button onClick={() => move(r.id, -1)} disabled={i === 0} className="opacity-60 hover:opacity-100 disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => move(r.id, 1)} disabled={i === rows.length - 1} className="opacity-60 hover:opacity-100 disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
              </div>
              <Switch checked={r.enabled} onCheckedChange={(v) => update(r.id, { enabled: v })} />
              <Select value={r.path} onValueChange={(v) => update(r.id, { path: v })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APP_ROUTES.map((p) => (
                    <SelectItem key={p.path} value={p.path}>{p.label} <code className="text-xs opacity-60">({p.path})</code></SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input className="w-40" placeholder="Icon (e.g. Home)" value={r.icon} onChange={(e) => update(r.id, { icon: e.target.value })} />
              <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Label EN" value={r.label_en ?? ""} onChange={(e) => update(r.id, { label_en: e.target.value })} />
              <Input placeholder="Label BN" value={r.label_bn ?? ""} onChange={(e) => update(r.id, { label_bn: e.target.value })} />
              <Input dir="rtl" placeholder="Label AR" value={r.label_ar ?? ""} onChange={(e) => update(r.id, { label_ar: e.target.value })} />
            </div>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={saveAll} disabled={saving || enabledCount > 5}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save & publish
        </Button>
      </div>
    </div>
  );
}
