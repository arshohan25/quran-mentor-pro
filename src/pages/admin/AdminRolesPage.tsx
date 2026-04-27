import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Shield, ShieldCheck, ShieldOff, Loader2, RefreshCw, ScrollText, UserCog, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type AppRole = "admin" | "moderator" | "user";

interface AdminUser {
  id: string;
  email?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  roles: AppRole[];
}

interface AuditLog {
  id: string;
  action: string;
  actor_id: string | null;
  target_id: string | null;
  target_type: string | null;
  metadata: any;
  created_at: string;
}

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-primary text-primary-foreground",
  moderator: "bg-accent text-accent-foreground",
  user: "bg-muted text-muted-foreground",
};

function highestRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("moderator")) return "moderator";
  return "user";
}

export default function AdminRolesPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "list_users", page: 1, perPage: 100, search },
    });
    if (error) {
      toast.error("Failed to load users");
      setLoading(false);
      return;
    }
    setUsers((data as any)?.users ?? []);
    setLoading(false);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .in("action", ["role.assigned", "role.revoked"])
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast.error("Failed to load audit logs");
    } else {
      setLogs((data as AuditLog[]) ?? []);
    }
    setLogsLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const adminCount = useMemo(
    () => users.filter((u) => u.roles.includes("admin")).length,
    [users]
  );
  const isLastAdmin = (u: AdminUser) =>
    u.roles.includes("admin") && adminCount <= 1;

  const changeRole = async (target: AdminUser, newRole: AppRole) => {
    const current = highestRole(target.roles);
    if (current === newRole) return;

    if (target.id === currentUser?.id && current === "admin" && newRole !== "admin") {
      toast.error("You cannot demote yourself from admin");
      return;
    }

    if (current === "admin" && newRole !== "admin" && isLastAdmin(target)) {
      toast.error("Cannot revoke admin — this is the last remaining admin");
      return;
    }

    setBusy(target.id);
    try {
      // Remove existing privileged roles (admin/moderator) other than the target
      const toRemove = (target.roles ?? []).filter(
        (r) => (r === "admin" || r === "moderator") && r !== newRole
      );
      for (const r of toRemove) {
        const { error } = await supabase.functions.invoke("admin-users", {
          body: { action: "remove_role", user_id: target.id, role: r },
        });
        if (error) throw error;
      }
      // Assign the new role (skip when it's the implicit "user")
      if (newRole !== "user" && !target.roles.includes(newRole)) {
        const { error } = await supabase.functions.invoke("admin-users", {
          body: { action: "set_role", user_id: target.id, role: newRole },
        });
        if (error) throw error;
      }
      toast.success(`Role updated to ${newRole}`);
      await Promise.all([fetchUsers(), fetchLogs()]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update role");
    } finally {
      setBusy(null);
    }
  };

  const userById = (id: string | null) =>
    id ? users.find((u) => u.id === id) : undefined;

  const fmtTime = (s: string) => new Date(s).toLocaleString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" /> Roles
        </h1>
        <p className="text-sm text-muted-foreground">
          Promote, demote, and audit role changes across users.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Current admins
              </p>
              {loading ? (
                <Skeleton className="h-7 w-16 mt-0.5" />
              ) : (
                <p className="text-2xl font-bold leading-tight">{adminCount}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {adminCount <= 1
                  ? "Only one admin remains — revoke is locked to prevent lockout."
                  : "At least one admin must always be present."}
              </p>
            </div>
          </div>
          {adminCount <= 1 && !loading && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Promote another user to admin before revoking the last one.</span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Manage user roles
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search email or id…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchUsers} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Current role</TableHead>
                <TableHead>Change to</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const current = highestRole(u.roles);
                  const isSelf = u.id === currentUser?.id;
                  const lockRevoke =
                    current === "admin" && (isSelf || isLastAdmin(u));
                  const lockReason = isSelf
                    ? "You cannot demote yourself"
                    : "Last remaining admin — promote another user first";
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                              {(u.display_name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate flex items-center gap-1.5">
                              {u.display_name ?? "—"}
                              {isSelf && (
                                <Badge variant="outline" className="text-[10px] py-0 h-4">you</Badge>
                              )}
                              {current === "admin" && isLastAdmin(u) && !isSelf && (
                                <Badge variant="outline" className="text-[10px] py-0 h-4 border-destructive/40 text-destructive">
                                  last admin
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[current]}>{current}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={current}
                            onValueChange={(v) => changeRole(u, v as AppRole)}
                            disabled={busy === u.id}
                          >
                            <SelectTrigger
                              className="w-36"
                              title={lockRevoke ? lockReason : undefined}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user" disabled={lockRevoke}>
                                <div className="flex items-center gap-2">
                                  <ShieldOff className="h-3.5 w-3.5" /> User
                                </div>
                              </SelectItem>
                              <SelectItem value="moderator" disabled={lockRevoke}>
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="h-3.5 w-3.5" /> Moderator
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-3.5 w-3.5" /> Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {busy === u.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>
                        {lockRevoke && (
                          <p className="text-[10px] text-muted-foreground mt-1">{lockReason}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" /> Recent role changes
          </h2>
          <Button variant="outline" size="icon" onClick={fetchLogs} aria-label="Refresh logs">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Target user</TableHead>
                <TableHead>Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    No role changes yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const target = userById(log.target_id);
                  const actor = userById(log.actor_id);
                  const role = log.metadata?.role as AppRole | undefined;
                  const assigned = log.action === "role.assigned";
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {fmtTime(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={assigned ? "default" : "outline"}>
                          {assigned ? "assigned" : "revoked"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {role ? <Badge className={ROLE_COLORS[role]}>{role}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {target?.email ?? (
                          <span className="text-muted-foreground font-mono text-xs">
                            {log.target_id?.slice(0, 8) ?? "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {actor?.email ?? (
                          <span className="text-muted-foreground font-mono text-xs">
                            {log.actor_id?.slice(0, 8) ?? "system"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
