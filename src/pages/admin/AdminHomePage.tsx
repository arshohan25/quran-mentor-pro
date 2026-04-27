import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Row {
  id: string; key: string; enabled: boolean; sort_order: number;
  title_bn: string | null; title_en: string | null; title_ar: string | null;
  subtitle_bn: string | null; subtitle_en: string | null; subtitle_ar: string | null;
  cta_label_bn: string | null; cta_label_en: string | null; cta_label_ar: string | null;
  link: string | null; icon: string | null;
}

export default function AdminHomePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("home_sections").select("*").order("sort_order");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const update = (id: string, patch: Partial<Row>) =>
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
    const { error } = await supabase.from("home_sections").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
    toast.success("Removed");
  };

  const addNew = async () => {
    const key = prompt("Unique section key (e.g. 'my_card')")?.trim();
    if (!key) return;
    const { data, error } = await supabase
      .from("home_sections")
      .insert({ key, sort_order: (rows.at(-1)?.sort_order ?? 0) + 10, title_en: key })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows((rs) => [...rs, data as Row]);
  };

  const saveAll = async () => {
    setSaving(true);
    for (const r of rows) {
      const { id, ...patch } = r;
      const { error } = await supabase.from("home_sections").update(patch).eq("id", id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success("Saved & live for all users");
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Home Sections</h1>
          <p className="text-sm text-muted-foreground">Toggle, reorder and edit cards on the home page.</p>
        </div>
        <Button variant="outline" onClick={addNew}><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <Card key={r.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <button onClick={() => move(r.id, -1)} disabled={i === 0} className="opacity-60 hover:opacity-100 disabled:opacity-20">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={() => move(r.id, 1)} disabled={i === rows.length - 1} className="opacity-60 hover:opacity-100 disabled:opacity-20">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <code className="text-xs font-mono text-muted-foreground flex-1">{r.key}</code>
              <Switch checked={r.enabled} onCheckedChange={(v) => update(r.id, { enabled: v })} />
              <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="Title EN" value={r.title_en ?? ""} onChange={(e) => update(r.id, { title_en: e.target.value })} />
              <Input placeholder="Title BN" value={r.title_bn ?? ""} onChange={(e) => update(r.id, { title_bn: e.target.value })} />
              <Input dir="rtl" placeholder="Title AR" value={r.title_ar ?? ""} onChange={(e) => update(r.id, { title_ar: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="Subtitle EN" value={r.subtitle_en ?? ""} onChange={(e) => update(r.id, { subtitle_en: e.target.value })} />
              <Input placeholder="Subtitle BN" value={r.subtitle_bn ?? ""} onChange={(e) => update(r.id, { subtitle_bn: e.target.value })} />
              <Input dir="rtl" placeholder="Subtitle AR" value={r.subtitle_ar ?? ""} onChange={(e) => update(r.id, { subtitle_ar: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input placeholder="Link (e.g. /quran)" value={r.link ?? ""} onChange={(e) => update(r.id, { link: e.target.value })} />
              <Input placeholder="Lucide icon name (e.g. BookOpen)" value={r.icon ?? ""} onChange={(e) => update(r.id, { icon: e.target.value })} />
            </div>
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
