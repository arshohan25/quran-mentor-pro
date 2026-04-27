import { useEffect, useMemo, useState } from "react";
import { Trash2, Download, Loader2, Search, Filter, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { surahList } from "@/data/surahList";
import { toast } from "sonner";

type Tab = "recitations" | "word_stats" | "bookmarks" | "hifz" | "qaza";

const TABLES: Record<Tab, string> = {
  recitations: "recitation_sessions",
  word_stats: "recitation_word_stats",
  bookmarks: "bookmarks_sync",
  hifz: "hifz_srs",
  qaza: "qaza_sync",
};

const ORDER_COL: Record<Tab, string> = {
  recitations: "created_at",
  word_stats: "last_seen_at",
  bookmarks: "created_at",
  hifz: "created_at",
  qaza: "updated_at",
};

const ACCURACY_OPTIONS = [
  { value: "all", label: "All accuracy" },
  { value: "low", label: "Low (<60%)" },
  { value: "mid", label: "Medium (60–85%)" },
  { value: "high", label: "High (>85%)" },
];

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>("recitations");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [surahFilter, setSurahFilter] = useState<string>("all");
  const [ayahFilter, setAyahFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  const [accuracyBucket, setAccuracyBucket] = useState<string>("all");
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from(TABLES[tab] as any)
      .select("*")
      .order(ORDER_COL[tab], { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setRows((data as any[]) ?? []);
        setLoading(false);
      });
  }, [tab]);

  const supportsRecitationFilters = tab === "recitations" || tab === "word_stats";
  const supportsAyahFilter = tab !== "qaza";

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) return false;
      if (userFilter && !String(r.user_id ?? "").toLowerCase().includes(userFilter.toLowerCase())) return false;
      if (surahFilter !== "all" && String(r.surah) !== surahFilter) return false;
      if (ayahFilter && String(r.ayah) !== ayahFilter.trim()) return false;
      if (accuracyBucket !== "all" && tab === "recitations") {
        const acc = Number(r.accuracy ?? 0);
        if (accuracyBucket === "low" && !(acc < 0.6)) return false;
        if (accuracyBucket === "mid" && !(acc >= 0.6 && acc <= 0.85)) return false;
        if (accuracyBucket === "high" && !(acc > 0.85)) return false;
      }
      return true;
    });
  }, [rows, search, userFilter, surahFilter, ayahFilter, accuracyBucket, tab]);

  const clearFilters = () => {
    setSearch("");
    setSurahFilter("all");
    setAyahFilter("");
    setUserFilter("");
    setAccuracyBucket("all");
  };

  const filtersActive =
    !!search || surahFilter !== "all" || !!ayahFilter || !!userFilter || accuracyBucket !== "all";

  const del = async (id: string) => {
    const { error } = await supabase.from(TABLES[tab] as any).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Deleted");
  };

  const bulkDelete = async () => {
    if (filtered.length === 0) return;
    setBulkBusy(true);
    const ids = filtered.map((r) => r.id);
    const { error } = await supabase.from(TABLES[tab] as any).delete().in("id", ids);
    setBulkBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
    toast.success(`Deleted ${ids.length} records`);
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
    if (tab === "recitations") {
      const acc = Number(r.accuracy ?? 0);
      const accColor =
        acc < 0.6 ? "bg-destructive/15 text-destructive"
        : acc <= 0.85 ? "bg-accent/20 text-accent-foreground"
        : "bg-primary/15 text-primary";
      return (
        <>
          <TableCell className="font-mono text-[10px]">{r.user_id?.slice(0, 8)}</TableCell>
          <TableCell className="font-medium">{r.surah}:{r.ayah}</TableCell>
          <TableCell><Badge className={accColor}>{(acc * 100).toFixed(0)}%</Badge></TableCell>
          <TableCell className="text-xs">
            <span className="text-primary">{r.correct_words}</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-destructive">{r.error_words}</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-accent-foreground">{r.hesitation_words}</span>
            <span className="text-muted-foreground"> of {r.total_words}</span>
          </TableCell>
          <TableCell className="text-xs text-muted-foreground">
            {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : "—"}
          </TableCell>
          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(r.created_at).toLocaleDateString()}
          </TableCell>
        </>
      );
    }
    if (tab === "word_stats") {
      const errRate = r.attempts > 0 ? r.errors / r.attempts : 0;
      return (
        <>
          <TableCell className="font-mono text-[10px]">{r.user_id?.slice(0, 8)}</TableCell>
          <TableCell>{r.surah}:{r.ayah}</TableCell>
          <TableCell className="text-xs">word #{r.word_index}</TableCell>
          <TableCell className="text-xs">
            <span className="text-primary">{r.correct}</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-destructive">{r.errors}</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-accent-foreground">{r.hesitations}</span>
          </TableCell>
          <TableCell>
            <Badge className={errRate > 0.4 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}>
              {(errRate * 100).toFixed(0)}% err
            </Badge>
          </TableCell>
          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(r.last_seen_at).toLocaleDateString()}
          </TableCell>
        </>
      );
    }
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
        <TableCell className="text-xs">F:{r.fajr} D:{r.dhuhr} A:{r.asr} M:{r.maghrib} I:{r.isha} W:{r.witr}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</TableCell>
        <TableCell />
      </>
    );
  };

  const headers: string[] =
    tab === "recitations" ? ["User", "Ayah", "Accuracy", "Correct/Err/Hes", "Duration", "Date"]
    : tab === "word_stats" ? ["User", "Ayah", "Word", "Correct/Err/Hes", "Err rate", "Last seen"]
    : tab === "bookmarks" ? ["User", "Ayah", "Note", "Created"]
    : tab === "hifz" ? ["User", "Ayah", "SRS", "Next review"]
    : ["User", "Counts", "Updated", ""];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review and remove user-generated Quran content — recitations, bookmarks, memorization & more.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); clearFilters(); }}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="recitations">Recitations</TabsTrigger>
          <TabsTrigger value="word_stats">Word stats</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          <TabsTrigger value="hifz">Hifz</TabsTrigger>
          <TabsTrigger value="qaza">Qaza</TabsTrigger>
        </TabsList>

        {/* Filters bar */}
        <div className="mt-3 rounded-xl border bg-card p-3 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Filters
            {filtersActive && (
              <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto text-xs" onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search any field…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Input
              placeholder="User ID prefix"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="h-9 font-mono text-xs"
            />
            <Select value={surahFilter} onValueChange={setSurahFilter}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Surah" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All surahs</SelectItem>
                {surahList.map((s) => (
                  <SelectItem key={s.number} value={String(s.number)}>
                    {s.number}. {s.englishName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {supportsAyahFilter ? (
              <Input
                placeholder="Ayah #"
                value={ayahFilter}
                onChange={(e) => setAyahFilter(e.target.value)}
                inputMode="numeric"
                className="h-9"
              />
            ) : <div />}
            {tab === "recitations" && (
              <Select value={accuracyBucket} onValueChange={setAccuracyBucket}>
                <SelectTrigger className="h-9 lg:col-span-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCURACY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {rows.length} (max 300 loaded)
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8" onClick={exportCsv} disabled={filtered.length === 0}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8"
                    disabled={!filtersActive || filtered.length === 0 || bulkBusy}
                  >
                    {bulkBusy
                      ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                    Delete filtered ({filtered.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {filtered.length} record(s)?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the records currently matching your filters. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={bulkDelete}
                    >
                      Delete all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <TabsContent value={tab} className="mt-3">
          <div className="rounded-xl border bg-card overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                {filtersActive ? "No records match your filters." : "No records."}
              </div>
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
          <p className="text-[10px] text-muted-foreground mt-2">
            Note: Quran translations are sourced read-only from Al Quran Cloud — there is no user-submitted translation content to moderate.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
