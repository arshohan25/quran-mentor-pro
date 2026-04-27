import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Branding {
  id: number;
  app_name_bn: string; app_name_en: string; app_name_ar: string;
  tagline_bn: string; tagline_en: string; tagline_ar: string;
  logo_url: string | null;
  primary_hsl: string; accent_hsl: string; gold_hsl: string;
  default_language: string; default_theme: string;
}

export default function AdminBrandingPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-branding"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_branding").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as Branding;
    },
  });

  const [draft, setDraft] = useState<Branding | null>(null);
  const current = draft ?? data ?? null;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (isLoading || !current) return <Skeleton className="h-96" />;

  const set = <K extends keyof Branding>(k: K, v: Branding[K]) =>
    setDraft({ ...(current as Branding), [k]: v });

  const save = async () => {
    setSaving(true);
    const { id, ...patch } = current;
    const { error } = await supabase.from("app_branding").update(patch).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Branding pushed live to all users");
    qc.invalidateQueries({ queryKey: ["admin-branding"] });
  };

  const onUploadLogo = async (file: File) => {
    setUploading(true);
    const path = `logo-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("branding").upload(path, file, {
      cacheControl: "3600", upsert: true,
    });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
    set("logo_url", pub.publicUrl);
    setUploading(false);
    toast.success("Logo uploaded");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Branding</h1>
        <p className="text-sm text-muted-foreground">
          Edit the app name, tagline, logo, colors and defaults. Changes apply live to every user.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <h3 className="font-bold text-sm">App name</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label className="text-xs">English</Label>
            <Input value={current.app_name_en} onChange={(e) => set("app_name_en", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">বাংলা</Label>
            <Input value={current.app_name_bn} onChange={(e) => set("app_name_bn", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">العربية</Label>
            <Input dir="rtl" value={current.app_name_ar} onChange={(e) => set("app_name_ar", e.target.value)} /></div>
        </div>

        <h3 className="font-bold text-sm pt-2">Tagline</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="English" value={current.tagline_en ?? ""} onChange={(e) => set("tagline_en", e.target.value)} />
          <Input placeholder="বাংলা" value={current.tagline_bn ?? ""} onChange={(e) => set("tagline_bn", e.target.value)} />
          <Input dir="rtl" placeholder="العربية" value={current.tagline_ar ?? ""} onChange={(e) => set("tagline_ar", e.target.value)} />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-bold text-sm">Logo</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
            {current.logo_url ? (
              <img src={current.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && onUploadLogo(e.target.files[0])} />
            <Button type="button" variant="outline" disabled={uploading} asChild>
              <span>{uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Upload</span>
            </Button>
          </label>
          {current.logo_url && (
            <Button variant="ghost" size="sm" onClick={() => set("logo_url", null)}>
              <Trash2 className="w-4 h-4 mr-1" /> Remove
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-bold text-sm">Colors (HSL — e.g. <code>142 45% 35%</code>)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Primary</Label>
            <Input value={current.primary_hsl} onChange={(e) => set("primary_hsl", e.target.value)} />
            <div className="h-6 rounded" style={{ background: `hsl(${current.primary_hsl})` }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Accent</Label>
            <Input value={current.accent_hsl} onChange={(e) => set("accent_hsl", e.target.value)} />
            <div className="h-6 rounded" style={{ background: `hsl(${current.accent_hsl})` }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Gold</Label>
            <Input value={current.gold_hsl} onChange={(e) => set("gold_hsl", e.target.value)} />
            <div className="h-6 rounded" style={{ background: `hsl(${current.gold_hsl})` }} />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-bold text-sm">Defaults</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Default language</Label>
            <Select value={current.default_language} onValueChange={(v) => set("default_language", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bn">বাংলা</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default theme</Label>
            <Select value={current.default_theme} onValueChange={(v) => set("default_theme", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Apply to all users
        </Button>
      </div>
    </div>
  );
}
