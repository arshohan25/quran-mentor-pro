import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Shield, ShieldCheck, ShieldOff, Loader2, RefreshCw, ScrollText, UserCog, AlertTriangle, Check, X, Hourglass, MessageSquare } from "lucide-react";
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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

interface PromotionRequest {
  id: string;
  target_user_id: string;
  requested_by: string;
  status: "pending" | "approved" | "cancelled";
  reason: string | null;
  created_at: string;
  applied_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  approvals: { approver_id: string; created_at: string }[];
  approval_count: number;
  required_approvals: number;
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
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [requiredApprovals, setRequiredApprovals] = useState(2);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [requestBusy, setRequestBusy] = useState<string | null>(null);
  const [reviewRequest, setReviewRequest] = useState<PromotionRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approve" | "deny">("approve");
  const [reviewReason, setReviewReason] = useState("");

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
      .in("action", [
        "role.assigned",
        "role.revoked",
        "admin_request.created",
        "admin_request.approved",
        "admin_request.applied",
        "admin_request.cancelled",
      ])
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      toast.error("Failed to load audit logs");
    } else {
      setLogs((data as AuditLog[]) ?? []);
    }
    setLogsLoading(false);
  }, []);

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "list_admin_requests" },
    });
    if (error) {
      toast.error("Failed to load admin requests");
    } else {
      setRequests(((data as any)?.requests ?? []) as PromotionRequest[]);
      setRequiredApprovals((data as any)?.required_approvals ?? 2);
    }
    setRequestsLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const adminCount = useMemo(
    () => users.filter((u) => u.roles.includes("admin")).length,
    [users]
  );
  const isLastAdmin = (u: AdminUser) =>
    u.roles.includes("admin") && adminCount <= 1;

  const pendingRequestForUser = useCallback(
    (userId: string) =>
      requests.find((r) => r.target_user_id === userId && r.status === "pending"),
    [requests]
  );

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

    // Two-admin approval is required for granting admin
    if (newRole === "admin") {
      const existing = pendingRequestForUser(target.id);
      if (existing) {
        toast.info("A pending admin request already exists for this user");
        return;
      }
      setBusy(target.id);
      try {
        const { error } = await supabase.functions.invoke("admin-users", {
          body: { action: "request_admin", user_id: target.id },
        });
        if (error) throw error;
        toast.success(
          `Promotion request created — needs ${requiredApprovals} admin approvals`
        );
        await Promise.all([fetchRequests(), fetchLogs()]);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to create request");
      } finally {
        setBusy(null);
      }
      return;
    }

    setBusy(target.id);
    try {
      const toRemove = (target.roles ?? []).filter(
        (r) => (r === "admin" || r === "moderator") && r !== newRole
      );
      for (const r of toRemove) {
        const { error } = await supabase.functions.invoke("admin-users", {
          body: { action: "remove_role", user_id: target.id, role: r },
        });
        if (error) throw error;
      }
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

  const approveRequest = async (req: PromotionRequest, reason?: string) => {
    setRequestBusy(req.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "approve_admin", request_id: req.id, reason: reason ?? null },
      });
      if (error) throw error;
      const applied = (data as any)?.applied;
      const count = (data as any)?.approval_count ?? 0;
      const need = (data as any)?.required_approvals ?? requiredApprovals;
      toast.success(
        applied
          ? "Approval applied — user is now an admin"
          : `Approval recorded (${count}/${need})`
      );
      await Promise.all([fetchRequests(), fetchUsers(), fetchLogs()]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve");
    } finally {
      setRequestBusy(null);
    }
  };

  const cancelRequest = async (req: PromotionRequest, reason?: string) => {
    setRequestBusy(req.id);
    try {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "cancel_admin_request", request_id: req.id, reason: reason ?? null },
      });
      if (error) throw error;
      toast.success(reason ? "Request denied" : "Request cancelled");
      await Promise.all([fetchRequests(), fetchLogs()]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to cancel");
    } finally {
      setRequestBusy(null);
    }
  };

  const openReview = (req: PromotionRequest) => {
    setReviewRequest(req);
    setReviewDecision("approve");
    setReviewReason("");
  };

  const submitReview = async () => {
    if (!reviewRequest) return;
    const trimmed = reviewReason.trim();
    if (reviewDecision === "deny" && trimmed.length === 0) {
      toast.error("A reason is required when denying a request");
      return;
    }
    const req = reviewRequest;
    setReviewRequest(null);
    if (reviewDecision === "approve") {
      await approveRequest(req, trimmed || undefined);
    } else {
      await cancelRequest(req, trimmed);
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-primary" /> Pending admin promotions
            </h2>
            <p className="text-xs text-muted-foreground">
              Granting admin requires {requiredApprovals} distinct admin approvals.
              Requesters cannot approve their own request.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchRequests} aria-label="Refresh requests">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {requestsLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : requests.filter((r) => r.status === "pending").length === 0 ? (
          <p className="text-sm text-muted-foreground italic px-1 py-4 text-center">
            No pending admin promotion requests.
          </p>
        ) : (
          <ul className="space-y-2">
            {requests
              .filter((r) => r.status === "pending")
              .map((r) => {
                const target = userById(r.target_user_id);
                const requester = userById(r.requested_by);
                const youApproved = r.approvals.some(
                  (a) => a.approver_id === currentUser?.id
                );
                const isOwnRequest = r.requested_by === currentUser?.id;
                const isOwnTarget = r.target_user_id === currentUser?.id;
                const cannotApprove = youApproved || isOwnRequest || isOwnTarget;
                const reason = isOwnRequest
                  ? "You created this request"
                  : isOwnTarget
                  ? "You are the target of this request"
                  : youApproved
                  ? "You already approved"
                  : "";
                const remaining = Math.max(
                  0,
                  (r.required_approvals ?? requiredApprovals) - r.approval_count
                );
                return (
                  <li
                    key={r.id}
                    className="rounded-lg border bg-background/40 p-3 flex flex-wrap items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{target?.display_name ?? target?.email ?? r.target_user_id.slice(0, 8)}</span>
                        <Badge className={ROLE_COLORS.admin}>→ admin</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Requested by {requester?.email ?? r.requested_by.slice(0, 8)} · {fmtTime(r.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {r.approval_count}/{r.required_approvals ?? requiredApprovals} approvals
                      {remaining > 0 && ` · ${remaining} more needed`}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => approveRequest(r)}
                        disabled={cannotApprove || requestBusy === r.id}
                        title={cannotApprove ? reason : "Approve promotion"}
                      >
                        {requestBusy === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1">Approve</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelRequest(r)}
                        disabled={requestBusy === r.id}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span className="ml-1">Cancel</span>
                      </Button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </Card>

      <FilterableAuditLog
        logs={logs}
        loading={logsLoading}
        onRefresh={fetchLogs}
        userById={userById}
        fmtTime={fmtTime}
      />
    </div>
  );
}

interface FilterableAuditLogProps {
  logs: AuditLog[];
  loading: boolean;
  onRefresh: () => void;
  userById: (id: string | null) => AdminUser | undefined;
  fmtTime: (s: string) => string;
}

type ActionFilter = "all" | "assigned" | "revoked";
type RoleFilter = "all" | AppRole;

function FilterableAuditLog({
  logs, loading, onRefresh, userById, fmtTime,
}: FilterableAuditLogProps) {
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [targetSearch, setTargetSearch] = useState("");

  const filtered = useMemo(() => {
    const q = targetSearch.trim().toLowerCase();
    return logs.filter((log) => {
      const role = log.metadata?.role as AppRole | undefined;
      const assigned = log.action === "role.assigned";

      if (actionFilter === "assigned" && !assigned) return false;
      if (actionFilter === "revoked" && assigned) return false;
      if (roleFilter !== "all" && role !== roleFilter) return false;

      if (q) {
        const target = userById(log.target_id);
        const actor = userById(log.actor_id);
        const hay = [
          target?.email, target?.display_name, log.target_id,
          actor?.email, actor?.display_name, log.actor_id,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, actionFilter, roleFilter, targetSearch, userById]);

  const counts = useMemo(() => {
    const c = { admin: 0, moderator: 0, user: 0 };
    filtered.forEach((l) => {
      const r = l.metadata?.role as AppRole | undefined;
      if (r && r in c) c[r] += 1;
    });
    return c;
  }, [filtered]);

  const resetFilters = () => {
    setActionFilter("all");
    setRoleFilter("all");
    setTargetSearch("");
  };
  const filtersActive =
    actionFilter !== "all" || roleFilter !== "all" || targetSearch.trim() !== "";

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-primary" /> Role change audit log
        </h2>
        <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh logs">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Action
          </label>
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as ActionFilter)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Role
          </label>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Target / actor
          </label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Email, name, or id…"
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">
          Showing {filtered.length} of {logs.length} entries
        </span>
        <span className="text-muted-foreground">·</span>
        <Badge className={ROLE_COLORS.admin}>admin {counts.admin}</Badge>
        <Badge className={ROLE_COLORS.moderator}>moderator {counts.moderator}</Badge>
        <Badge className={ROLE_COLORS.user}>user {counts.user}</Badge>
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
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                  {logs.length === 0
                    ? "No role changes yet"
                    : "No entries match the current filters"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => {
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
                      <div className="flex flex-col">
                        <span>{target?.display_name ?? target?.email ?? "—"}</span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                          {target?.email ?? log.target_id ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span>{actor?.display_name ?? actor?.email ?? "system"}</span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                          {actor?.email ?? log.actor_id ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
