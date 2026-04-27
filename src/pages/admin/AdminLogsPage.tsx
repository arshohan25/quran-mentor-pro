import { useEffect, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Log {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: any;
  created_at: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = filter
    ? logs.filter((l) => JSON.stringify(l).toLowerCase().includes(filter.toLowerCase()))
    : logs;

  const actionColor = (action: string) => {
    if (action.includes("delete")) return "destructive";
    if (action.includes("assigned")) return "default";
    if (action.includes("revoked")) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Last 200 admin actions.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="h-9 pl-8 w-48"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={fetchLogs}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No log entries.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionColor(l.action) as any} className="text-[10px] font-mono">
                      {l.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[10px]">{l.actor_id?.slice(0, 8) ?? "—"}</TableCell>
                  <TableCell className="font-mono text-[10px]">
                    {l.target_type}: {l.target_id?.slice(0, 8) ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground max-w-[300px] truncate">
                    {l.metadata && Object.keys(l.metadata).length > 0 ? JSON.stringify(l.metadata) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
