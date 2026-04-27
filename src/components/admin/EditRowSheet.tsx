import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EDITABLE_FIELDS: Record<string, { key: string; type: "number" | "text" | "datetime-local" }[]> = {
  recitation_sessions: [
    { key: "accuracy", type: "number" },
    { key: "correct_words", type: "number" },
    { key: "error_words", type: "number" },
    { key: "hesitation_words", type: "number" },
    { key: "duration_ms", type: "number" },
    { key: "mode", type: "text" },
    { key: "reciter", type: "text" },
    { key: "lesson_type", type: "text" },
    { key: "surah", type: "number" },
    { key: "ayah", type: "number" },
  ],
  recitation_word_stats: [
    { key: "attempts", type: "number" },
    { key: "correct", type: "number" },
    { key: "errors", type: "number" },
    { key: "hesitations", type: "number" },
  ],
  bookmarks_sync: [
    { key: "surah", type: "number" },
    { key: "ayah", type: "number" },
    { key: "note", type: "text" },
  ],
  hifz_srs: [
    { key: "ease_factor", type: "number" },
    { key: "interval_days", type: "number" },
    { key: "repetitions", type: "number" },
    { key: "next_review_at", type: "datetime-local" },
    { key: "last_quality", type: "number" },
  ],
  qaza_sync: [
    { key: "fajr", type: "number" }, { key: "dhuhr", type: "number" },
    { key: "asr", type: "number" }, { key: "maghrib", type: "number" },
    { key: "isha", type: "number" }, { key: "witr", type: "number" },
  ],
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  table: string;
  row: any;
  onSaved: () => void;
}

export default function EditRowSheet({ open, onOpenChange, table, row, onSaved }: Props) {
  const fields = EDITABLE_FIELDS[table] ?? [];
  const [values, setValues] = useState<Record<string, any>>(() => {
    const v: Record<string, any> = {};
    for (const f of fields) {
      const raw = row?.[f.key];
      v[f.key] = f.type === "datetime-local" && raw ? String(raw).slice(0, 16) : raw ?? "";
    }
    return v;
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const patch: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.key];
      if (v === "" || v === null || v === undefined) continue;
      patch[f.key] = f.type === "number" ? Number(v) :
        f.type === "datetime-local" ? new Date(v).toISOString() : v;
    }
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "update_row", table, row_id: row.id, patch },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Row updated");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit row · <code className="text-sm">{table}</code></SheetTitle>
        </SheetHeader>
        <div className="space-y-3 py-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">{f.key}</Label>
              <Input type={f.type} value={values[f.key] ?? ""}
                onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))} />
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">This table has no admin-editable fields.</p>
          )}
        </div>
        <SheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || fields.length === 0}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
