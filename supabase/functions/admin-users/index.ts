import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  action:
    | "list_users"
    | "set_role"
    | "remove_role"
    | "delete_user"
    | "request_admin"
    | "approve_admin"
    | "cancel_admin_request"
    | "list_admin_requests"
    | "validate_recitation_reciters";
  page?: number;
  perPage?: number;
  search?: string;
  user_id?: string;
  role?: "admin" | "moderator" | "user";
  request_id?: string;
  reason?: string;
  /** validate_recitation_reciters: limit examples returned (default 25) */
  sample_limit?: number;
  /** validate_recitation_reciters: optional ISO date to scope scan */
  since?: string;
}

/** Canonical reciter ids accepted by the app (mirrors src/data/prayerData.ts qariList). */
const KNOWN_RECITER_IDS = new Set<string>([
  "ar.alafasy",
  "ar.abdulbasitmurattal",
  "ar.abdurrahmaansudais",
  "ar.hudhaify",
  "ar.minshawi",
]);
const RECITER_SENTINEL_INVALID = new Set<string>(["", "unknown", "null", "undefined"]);
  page?: number;
  perPage?: number;
  search?: string;
  user_id?: string;
  role?: "admin" | "moderator" | "user";
  request_id?: string;
  reason?: string;
}

const REQUIRED_ADMIN_APPROVALS = 2;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client bound to the caller's JWT — used to verify admin status via has_role
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    // Verify admin via has_role (RLS-safe)
    const { data: isAdminData, error: roleErr } = await userClient.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    const callerIsAdmin = !roleErr && !!isAdminData;

    // Service-role client for privileged ops
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = (await req.json()) as Body;

    // Any mutation requires admin. Moderators are explicitly forbidden.
    const isMutation =
      body.action === "set_role" ||
      body.action === "remove_role" ||
      body.action === "delete_user" ||
      body.action === "request_admin" ||
      body.action === "approve_admin" ||
      body.action === "cancel_admin_request";

    if (isMutation && !callerIsAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden — only admins can change roles or delete users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Listing users (and admin requests) is allowed for admins and moderators.
    if (
      (body.action === "list_users" || body.action === "list_admin_requests") &&
      !callerIsAdmin
    ) {
      const { data: isModData } = await userClient.rpc("has_role", {
        _user_id: callerId,
        _role: "moderator",
      });
      if (!isModData) {
        return new Response(JSON.stringify({ error: "Forbidden — admin or moderator only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Helper: count current admins
    const countAdmins = async () => {
      const { count } = await admin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      return count ?? 0;
    };

    if (body.action === "list_users") {
      const page = Math.max(1, body.page ?? 1);
      const perPage = Math.min(200, Math.max(1, body.perPage ?? 50));
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      let users = data.users.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        confirmed_at: u.confirmed_at,
        provider: u.app_metadata?.provider,
      }));

      if (body.search?.trim()) {
        const q = body.search.toLowerCase();
        users = users.filter(
          (u) =>
            u.email?.toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q)
        );
      }

      // Fetch roles + profiles for these users in one go
      const ids = users.map((u) => u.id);
      const [{ data: roles }, { data: profiles }] = await Promise.all([
        admin.from("user_roles").select("user_id, role").in("user_id", ids),
        admin.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids),
      ]);

      const rolesByUser: Record<string, string[]> = {};
      (roles ?? []).forEach((r: any) => {
        rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] ?? []), r.role];
      });
      const profileByUser: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => {
        profileByUser[p.user_id] = p;
      });

      const merged = users.map((u) => ({
        ...u,
        roles: rolesByUser[u.id] ?? [],
        display_name: profileByUser[u.id]?.display_name ?? null,
        avatar_url: profileByUser[u.id]?.avatar_url ?? null,
      }));

      return new Response(
        JSON.stringify({ users: merged, page, perPage, total: data.total }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === "set_role") {
      if (!body.user_id || !body.role) {
        return new Response(JSON.stringify({ error: "user_id and role required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Granting the admin role MUST go through the two-admin approval flow.
      if (body.role === "admin") {
        return new Response(
          JSON.stringify({
            error: `Granting the admin role requires ${REQUIRED_ADMIN_APPROVALS} admin approvals. Use request_admin / approve_admin instead.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { error } = await admin
        .from("user_roles")
        .insert({ user_id: body.user_id, role: body.role, assigned_by: callerId });
      if (error && !error.message.includes("duplicate")) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "remove_role") {
      if (!body.user_id || !body.role) {
        return new Response(JSON.stringify({ error: "user_id and role required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Prevent removing your own admin role (lockout protection).
      if (body.role === "admin" && body.user_id === callerId) {
        return new Response(
          JSON.stringify({ error: "You cannot revoke your own admin role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Prevent removing the last remaining admin in the system.
      if (body.role === "admin") {
        const adminCount = await countAdmins();
        if (adminCount <= 1) {
          return new Response(
            JSON.stringify({ error: "Cannot revoke the last remaining admin" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      const { error } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", body.user_id)
        .eq("role", body.role);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "delete_user") {
      if (!body.user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (body.user_id === callerId) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await admin.auth.admin.deleteUser(body.user_id);
      if (error) throw error;
      await admin.from("audit_logs").insert({
        actor_id: callerId,
        action: "user.deleted",
        target_type: "user",
        target_id: body.user_id,
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ───────────────────── Two-admin approval flow ─────────────────────

    if (body.action === "list_admin_requests") {
      const { data: requests, error: reqErr } = await admin
        .from("admin_promotion_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (reqErr) throw reqErr;

      const reqIds = (requests ?? []).map((r: any) => r.id);
      const approvalsRes = reqIds.length
        ? await admin
            .from("admin_promotion_approvals")
            .select("request_id, approver_id, created_at")
            .in("request_id", reqIds)
        : { data: [], error: null };
      if (approvalsRes.error) throw approvalsRes.error;

      const byReq = new Map<string, any[]>();
      (approvalsRes.data ?? []).forEach((a: any) => {
        const list = byReq.get(a.request_id) ?? [];
        list.push(a);
        byReq.set(a.request_id, list);
      });

      const enriched = (requests ?? []).map((r: any) => ({
        ...r,
        approvals: byReq.get(r.id) ?? [],
        approval_count: (byReq.get(r.id) ?? []).length,
        required_approvals: REQUIRED_ADMIN_APPROVALS,
      }));

      return new Response(
        JSON.stringify({ requests: enriched, required_approvals: REQUIRED_ADMIN_APPROVALS }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === "request_admin") {
      if (!body.user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: existing } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", body.user_id)
        .eq("role", "admin")
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ error: "User is already an admin" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: created, error } = await admin
        .from("admin_promotion_requests")
        .insert({
          target_user_id: body.user_id,
          requested_by: callerId,
          reason: body.reason ?? null,
          status: "pending",
        })
        .select()
        .single();
      if (error) {
        if (error.message.includes("duplicate") || (error as any).code === "23505") {
          return new Response(
            JSON.stringify({ error: "A pending admin request already exists for this user" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw error;
      }
      return new Response(
        JSON.stringify({ ok: true, request: created, required_approvals: REQUIRED_ADMIN_APPROVALS }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === "approve_admin") {
      if (!body.request_id) {
        return new Response(JSON.stringify({ error: "request_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: reqRow, error: rErr } = await admin
        .from("admin_promotion_requests")
        .select("*")
        .eq("id", body.request_id)
        .single();
      if (rErr || !reqRow) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (reqRow.status !== "pending") {
        return new Response(
          JSON.stringify({ error: `Request is ${reqRow.status}, cannot approve` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (reqRow.requested_by === callerId) {
        return new Response(
          JSON.stringify({ error: "You cannot approve your own promotion request" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (reqRow.target_user_id === callerId) {
        return new Response(
          JSON.stringify({ error: "You cannot approve a promotion targeting yourself" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const reasonText = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null;

      const { error: aErr } = await admin
        .from("admin_promotion_approvals")
        .insert({ request_id: body.request_id, approver_id: callerId });
      if (aErr) {
        if (aErr.message.includes("duplicate") || (aErr as any).code === "23505") {
          return new Response(
            JSON.stringify({ error: "You have already approved this request" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw aErr;
      }

      // Audit-log the approval reason (if provided) so reviewers can trace decisions
      if (reasonText) {
        await admin.from("audit_logs").insert({
          actor_id: callerId,
          action: "admin_request.approval_reason",
          target_type: "user",
          target_id: reqRow.target_user_id,
          metadata: { request_id: body.request_id, reason: reasonText },
        });
      }

      const { count: approvalCount } = await admin
        .from("admin_promotion_approvals")
        .select("*", { count: "exact", head: true })
        .eq("request_id", body.request_id);

      const total = approvalCount ?? 0;
      let applied = false;
      if (total >= REQUIRED_ADMIN_APPROVALS) {
        const { error: insErr } = await admin
          .from("user_roles")
          .insert({
            user_id: reqRow.target_user_id,
            role: "admin",
            assigned_by: callerId,
          });
        if (insErr && !insErr.message.includes("duplicate")) throw insErr;

        const { error: updErr } = await admin
          .from("admin_promotion_requests")
          .update({ status: "approved", applied_at: new Date().toISOString() })
          .eq("id", body.request_id);
        if (updErr) throw updErr;
        applied = true;
      }

      return new Response(
        JSON.stringify({
          ok: true,
          applied,
          approval_count: total,
          required_approvals: REQUIRED_ADMIN_APPROVALS,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === "cancel_admin_request") {
      if (!body.request_id) {
        return new Response(JSON.stringify({ error: "request_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: reqRow } = await admin
        .from("admin_promotion_requests")
        .select("status")
        .eq("id", body.request_id)
        .single();
      if (!reqRow) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (reqRow.status !== "pending") {
        return new Response(
          JSON.stringify({ error: `Request is already ${reqRow.status}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const denyReason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null;
      const { error } = await admin
        .from("admin_promotion_requests")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: callerId,
        })
        .eq("id", body.request_id);
      if (error) throw error;

      if (denyReason) {
        await admin.from("audit_logs").insert({
          actor_id: callerId,
          action: "admin_request.deny_reason",
          target_type: "user",
          target_id: null,
          metadata: { request_id: body.request_id, reason: denyReason },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-users error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
