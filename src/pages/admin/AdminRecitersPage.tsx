import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2, ChevronUp, ChevronDown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import JsonImportExport from "@/components/admin/JsonImportExport";
import { toast } from "sonner";

interface Reciter {
  id: string; enabled: boolean; sort_order: number;
  name_bn: string | null; name_en: string | null; name_ar: string | null;
  external_id: string | null; is_default: boolean;
}

export default function AdminRecitersPage() {
  const [rows, setRows] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase.from("reciters").select("*").order("sort_order");
    setRows((data ?? []) as Reciter[]);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const update = (id: string, patch: Partial<Reciter>) =>
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

  const setDefault = async (id: string) => {
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "set_default_reciter", reciter_id: id },
    });
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => ({ ...r, is_default: r.id === id })));
    toast.success("Default reciter updated");
  };

  const add = async () => {
    const id = prompt("Reciter id (e.g. ar.alafasy)")?.trim();
    if (!id) return;
    const { data, error } = await supabase.from("reciters").insert({
      id, name_en: id, external_id: id, sort_order: (rows.at(-1)?.sort_order ?? 0) + 10,
    }).select().single();
    if (error) return toast.error(error.message);
    setRows((rs) => [...rs, data as Reciter]);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("reciters").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const saveAll = async () => {
    setSaving(true);
    for (const r of rows) {
      const { id, is_default, ...patch } = r;
      const { error } = await supabase.from("reciters").update(patch).eq("id", id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success("Reciters updated");
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reciters</h1>
          <p className="text-sm text-muted-foreground">Manage qaris available app-wide. Star = default.</p>
        </div>
        <Button variant="outline" onClick={add}><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <Card key={r.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <button onClick={() => move(r.id, -1)} disabled={i === 0} className="opacity-60 hover:opacity-100 disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => move(r.id, 1)} disabled={i === rows.length - 1} className="opacity-60 hover:opacity-100 disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
              </div>
              <Switch checked={r.enabled} onCheckedChange={(v) => update(r.id, { enabled: v })} />
              <code className="text-xs font-mono flex-1">{r.id}</code>
              <Button variant={r.is_default ? "default" : "outline"} size="sm" onClick={() => setDefault(r.id)}>
                <Star className={`w-4 h-4 mr-1 ${r.is_default ? "fill-current" : ""}`} /> Default
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="Name EN" value={r.name_en ?? ""} onChange={(e) => update(r.id, { name_en: e.target.value })} />
              <Input placeholder="Name BN" value={r.name_bn ?? ""} onChange={(e) => update(r.id, { name_bn: e.target.value })} />
              <Input dir="rtl" placeholder="Name AR" value={r.name_ar ?? ""} onChange={(e) => update(r.id, { name_ar: e.target.value })} />
            </div>
            <Input placeholder="External id (AlQuran.cloud edition)" value={r.external_id ?? ""} onChange={(e) => update(r.id, { external_id: e.target.value })} />
          </Card>
        ))}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save & publish
        </Button>
      </div>
    </div>
  );
}
