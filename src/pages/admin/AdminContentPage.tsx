import { useEffect, useState } from "react";
import { Trash2, Download, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "bookmarks" | "hifz" | "qaza";

const TABLES: Record<Tab, string> = {
  bookmarks: "bookmarks_sync",
  hifz: "hifz_srs",
  qaza: "qaza_sync",
};

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>("bookmarks");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    supabase
      .from(TABLES[tab] as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setRows((data as any[]) ?? []);
        setLoading(false);
      });
  }, [tab]);

  const filtered = filter
    ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(filter.toLowerCase()))
    : rows;

  const del = async (id: string) => {
    const { error } = await supabase.from(TABLES[tab] as any).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Deleted");
  };

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const keys = Object.keys(filtered[0]);
    const csv = [
      keys.join(","),
      ...filtered.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${TABLES[tab]}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderRow = (r: any) => {
    if (tab === "bookmarks") {
      return (
        <>
          <TableCell className="font-mono text-[10px]">{r.user_id?.slice(0, 8)}</TableCell>
          <TableCell>{r.surah}:{r.ayah}</TableCell>
          <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{r.note ?? "—"}</TableCell>
          <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
        </>
      );
    }
    if (tab === "hifz") {
      return (
        <>
          <TableCell className="font-mono text-[10px]">{r.user_id?.slice(0, 8)}</TableCell>
          <TableCell>{r.surah}:{r.ayah}</TableCell>
          <TableCell>{r.repetitions}× / EF {r.ease_factor?.toFixed(2)}</TableCell>
          <TableCell className="text-xs text-muted-foreground">{new Date(r.next_review_at).toLocaleDateString()}</TableCell>
        </>
      );
    }
    return (
      <>
        <TableCell className="font-mono text-[10px]">{r.user_id?.slice(0, 8)}</TableCell>
        <TableCell>F:{r.fajr} D:{r.dhuhr} A:{r.asr} M:{r.maghrib} I:{r.isha} W:{r.witr}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</TableCell>
        <TableCell />
      </>
    );
  };

  const headers =
    tab === "bookmarks"
      ? ["User", "Ayah", "Note", "Created"]
      : tab === "hifz"
      ? ["User", "Ayah", "SRS", "Next review"]
      : ["User", "Counts", "Updated", ""];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content</h1>
        <p className="text-sm text-muted-foreground">Inspect and moderate user-generated data.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="hifz">Hifz</TabsTrigger>
            <TabsTrigger value="qaza">Qaza</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="h-9 w-48"
            />
            <Button variant="outline" size="sm" className="h-9" onClick={exportCsv}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
            </Button>
          </div>
        </div>

        <TabsContent value={tab} className="mt-3">
          <div className="rounded-xl border bg-card overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No records.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => <TableHead key={h}>{h}</TableHead>)}
                    <TableHead className="text-right w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      {renderRow(r)}
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete record?</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => del(r.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Showing latest 200 rows.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
