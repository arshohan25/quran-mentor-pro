import { useCallback, useEffect, useState } from "react";
import { Search, Shield, ShieldCheck, ShieldOff, Trash2, Loader2, RefreshCw, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminUser {
  id: string;
  email?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  provider?: string;
  roles: ("admin" | "moderator" | "user")[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const setRole = async (user_id: string, role: "admin" | "moderator", action: "set" | "remove") => {
    setBusy(user_id);
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: action === "set" ? "set_role" : "remove_role", user_id, role },
    });
    setBusy(null);
    if (error) {
      toast.error(`Failed to ${action} role`);
      return;
    }
    toast.success(`${role} ${action === "set" ? "granted" : "revoked"}`);
    fetchUsers();
  };

  const deleteUser = async (user_id: string, email?: string) => {
    setBusy(user_id);
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "delete_user", user_id },
    });
    setBusy(null);
    if (error) {
      toast.error("Failed to delete user");
      return;
    }
    toast.success(`Deleted ${email ?? user_id.slice(0, 8)}`);
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Manage accounts and roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              placeholder="Search email or id…"
              className="h-9 pl-8 w-64"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={fetchUsers}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No users found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(u.display_name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {u.display_name ?? u.email ?? u.id.slice(0, 8)}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 && <Badge variant="outline" className="text-[10px]">user</Badge>}
                      {u.roles.map((r) => (
                        <Badge
                          key={r}
                          variant={r === "admin" ? "default" : "secondary"}
                          className="text-[10px] capitalize"
                        >
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">
                    {u.provider ?? "email"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy === u.id}>
                          {busy === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCog className="w-3.5 h-3.5" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Roles</DropdownMenuLabel>
                        {u.roles.includes("admin") ? (
                          <DropdownMenuItem onClick={() => setRole(u.id, "admin", "remove")}>
                            <ShieldOff className="w-3.5 h-3.5 mr-2" /> Revoke admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setRole(u.id, "admin", "set")}>
                            <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Make admin
                          </DropdownMenuItem>
                        )}
                        {u.roles.includes("moderator") ? (
                          <DropdownMenuItem onClick={() => setRole(u.id, "moderator", "remove")}>
                            <ShieldOff className="w-3.5 h-3.5 mr-2" /> Revoke moderator
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setRole(u.id, "moderator", "set")}>
                            <Shield className="w-3.5 h-3.5 mr-2" /> Make moderator
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete user
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes <span className="font-mono">{u.email ?? u.id}</span> and all their data. Cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteUser(u.id, u.email)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">Showing first 100 results. Refine with search.</p>
    </div>
  );
}
