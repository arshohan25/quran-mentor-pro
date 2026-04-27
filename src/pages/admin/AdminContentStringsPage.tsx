import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2, Globe, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMMON_COUNTRIES } from "@/hooks/useUserCountry";
import { toast } from "sonner";

interface Item {
  id: string; key: string; bn: string | null; en: string | null; ar: string | null; enabled: boolean;
}

interface Locale {
  id: string; key: string; language: "bn" | "en" | "ar"; country: string; value: string; enabled: boolean;
}

const LANGS: Locale["language"][] = ["en", "bn", "ar"];

export default function AdminContentStringsPage() {
  const [rows, setRows] = useState<Item[]>([]);
  const [locales, setLocales] = useState<Record<string, Locale[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const reload = async () => {
    setLoading(true);
    const [{ data: items }, { data: locs }] = await Promise.all([
      supabase.from("content_items").select("*").order("key"),
      supabase.from("content_item_locales").select("*"),
    ]);
    setRows((items ?? []) as Item[]);
    const byKey: Record<string, Locale[]> = {};
    (locs ?? []).forEach((l: any) => {
      byKey[l.key] ??= [];
      byKey[l.key].push(l);
    });
    setLocales(byKey);
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

  // Locale management
  const addLocale = async (key: string) => {
    const { data, error } = await supabase
      .from("content_item_locales")
      .insert({ key, language: "en", country: "us", value: "" })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setLocales((m) => ({ ...m, [key]: [...(m[key] ?? []), data as Locale] }));
  };
  const updateLocale = async (id: string, patch: Partial<Locale>) => {
    const { error } = await supabase.from("content_item_locales").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setLocales((m) => {
      const next: Record<string, Locale[]> = {};
      for (const [k, v] of Object.entries(m)) {
        next[k] = v.map((l) => (l.id === id ? { ...l, ...patch } : l));
      }
      return next;
    });
  };
  const removeLocale = async (id: string) => {
    const { error } = await supabase.from("content_item_locales").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setLocales((m) => {
      const next: Record<string, Locale[]> = {};
      for (const [k, v] of Object.entries(m)) next[k] = v.filter((l) => l.id !== id);
      return next;
    });
  };

  const toggleExpand = (key: string) => {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const filtered = rows.filter((r) => !filter || r.key.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Content Strings</h1>
          <p className="text-sm text-muted-foreground">Edit any labeled text snippet across the app, with optional per-country overrides.</p>
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
          {filtered.map((r) => {
            const isOpen = expanded.has(r.key);
            const myLocales = locales[r.key] ?? [];
            return (
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

                <button
                  type="button"
                  onClick={() => toggleExpand(r.key)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <Globe className="w-3.5 h-3.5" />
                  Country overrides {myLocales.length > 0 && <span className="ml-1 px-1.5 rounded bg-muted">{myLocales.length}</span>}
                </button>

                {isOpen && (
                  <div className="space-y-2 pt-1 border-t mt-2">
                    {myLocales.map((l) => (
                      <div key={l.id} className="flex flex-wrap items-center gap-2">
                        <Select value={l.language} onValueChange={(v) => updateLocale(l.id, { language: v as Locale["language"] })}>
                          <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {LANGS.map((lg) => <SelectItem key={lg} value={lg}>{lg.toUpperCase()}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={l.country} onValueChange={(v) => updateLocale(l.id, { country: v })}>
                          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="*">* (any country)</SelectItem>
                            {COMMON_COUNTRIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>{c.name} ({c.code.toUpperCase()})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          dir={l.language === "ar" ? "rtl" : "ltr"}
                          placeholder="Override value"
                          className="flex-1 min-w-[200px] h-8 text-xs"
                          value={l.value}
                          onChange={(e) => updateLocale(l.id, { value: e.target.value })}
                        />
                        <Switch checked={l.enabled} onCheckedChange={(v) => updateLocale(l.id, { enabled: v })} />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLocale(l.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addLocale(r.key)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add country override
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
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
