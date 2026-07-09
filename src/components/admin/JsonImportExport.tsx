import { useRef, useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  /** Table to export/import against. Admin must have RLS write access. */
  table: string;
  /** Human filename stem, e.g. "reciters" */
  filename: string;
  /** Optional column ordering for select("*") — leave undefined to fetch all. */
  select?: string;
  /** Optional column used for upsert conflict resolution. Defaults to "id". */
  conflictColumn?: string;
  /** Called after a successful import so the caller can refresh its state. */
  onImported?: () => void;
  /** Optional row transform applied to each incoming row before upsert. */
  transformRow?: (row: any) => any;
}

/**
 * Reusable JSON export/import controls for admin CMS tables.
 * Export: downloads a `.json` file with all rows.
 * Import: reads a JSON array and upserts by `conflictColumn`.
 */
export default function JsonImportExport({
  table, filename, select = "*", conflictColumn = "id", onImported, transformRow,
}: Props) {
  const [busy, setBusy] = useState<null | "export" | "import">(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doExport = async () => {
    setBusy("export");
    const { data, error } = await supabase.from(table as any).select(select);
    setBusy(null);
    if (error) return toast.error(error.message);
    const blob = new Blob([JSON.stringify(data ?? [], null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${(data ?? []).length} rows`);
  };

  const doImport = async (file: File) => {
    setBusy("import");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("File must contain a JSON array");
      const rows = transformRow ? parsed.map(transformRow) : parsed;
      const { error } = await supabase
        .from(table as any)
        .upsert(rows, { onConflict: conflictColumn });
      if (error) throw error;
      toast.success(`Imported ${rows.length} rows`);
      onImported?.();
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={doExport} disabled={busy !== null}>
        {busy === "export" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
        Export
      </Button>
      <Button
        variant="outline" size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={busy !== null}
      >
        {busy === "import" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
        Import
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) doImport(f);
        }}
      />
    </div>
  );
}
