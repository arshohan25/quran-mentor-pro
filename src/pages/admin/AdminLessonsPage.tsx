import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePublicAppConfig } from "@/hooks/usePublicAppConfig";
import JsonImportExport from "@/components/admin/JsonImportExport";
import { toast } from "sonner";

interface Lesson {
  id: string; enabled: boolean; sort_order: number; category: string;
  title_bn: string | null; title_en: string | null; title_ar: string | null;
  description_bn: string | null; description_en: string | null; description_ar: string | null;
  target_surah: number | null; target_ayah_start: number | null; target_ayah_end: number | null;
  recommended_reciter_id: string | null;
}

const CATEGORIES = ["general", "tajweed", "memorization", "tarteel", "tafsir", "review"];

export default function AdminLessonsPage() {
  const { reciters } = usePublicAppConfig();
  const [rows, setRows] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase.from("lesson_items").select("*").order("sort_order");
    setRows((data ?? []) as Lesson[]);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const update = (id: string, patch: Partial<Lesson>) =>
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

  const add = async () => {
    const id = prompt("Lesson slug (unique, e.g. 'tajweed-noon-meem')")?.trim();
    if (!id) return;
    const { data, error } = await supabase.from("lesson_items").insert({
      id, title_en: id, sort_order: (rows.at(-1)?.sort_order ?? 0) + 10,
    }).select().single();
    if (error) return toast.error(error.message);
    setRows((rs) => [...rs, data as Lesson]);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    const { error } = await supabase.from("lesson_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const saveAll = async () => {
    setSaving(true);
    for (const r of rows) {
      const { id, ...patch } = r;
      const { error } = await supabase.from("lesson_items").update(patch).eq("id", id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success("Lessons updated");
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lesson Items</h1>
          <p className="text-sm text-muted-foreground">Curated lesson templates that show up in Live & Hifz sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <JsonImportExport table="lesson_items" filename="lesson-items" onImported={reload} />
          <Button variant="outline" onClick={add}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
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
              <Select value={r.category} onValueChange={(v) => update(r.id, { category: v })}>
                <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="Title EN" value={r.title_en ?? ""} onChange={(e) => update(r.id, { title_en: e.target.value })} />
              <Input placeholder="Title BN" value={r.title_bn ?? ""} onChange={(e) => update(r.id, { title_bn: e.target.value })} />
              <Input dir="rtl" placeholder="Title AR" value={r.title_ar ?? ""} onChange={(e) => update(r.id, { title_ar: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Textarea rows={2} placeholder="Description EN" value={r.description_en ?? ""} onChange={(e) => update(r.id, { description_en: e.target.value })} />
              <Textarea rows={2} placeholder="Description BN" value={r.description_bn ?? ""} onChange={(e) => update(r.id, { description_bn: e.target.value })} />
              <Textarea rows={2} dir="rtl" placeholder="Description AR" value={r.description_ar ?? ""} onChange={(e) => update(r.id, { description_ar: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input type="number" placeholder="Surah #" value={r.target_surah ?? ""} onChange={(e) => update(r.id, { target_surah: e.target.value === "" ? null : Number(e.target.value) })} />
              <Input type="number" placeholder="Ayah from" value={r.target_ayah_start ?? ""} onChange={(e) => update(r.id, { target_ayah_start: e.target.value === "" ? null : Number(e.target.value) })} />
              <Input type="number" placeholder="Ayah to" value={r.target_ayah_end ?? ""} onChange={(e) => update(r.id, { target_ayah_end: e.target.value === "" ? null : Number(e.target.value) })} />
              <Select value={r.recommended_reciter_id ?? "none"} onValueChange={(v) => update(r.id, { recommended_reciter_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Reciter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {reciters.filter((rc) => rc.enabled).map((rc) => (
                    <SelectItem key={rc.id} value={rc.id}>{rc.name_en ?? rc.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
