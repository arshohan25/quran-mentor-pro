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
    | "validate_recitation_reciters"
    | "update_row"
    | "update_user_profile"
    | "update_user_settings"
    | "set_default_reciter";
  /** update_row: target table (allowlisted) */
  table?: string;
  /** update_row: row id */
  row_id?: string;
  /** update_row / update_user_profile / update_user_settings: patch payload */
  patch?: Record<string, unknown>;
  /** set_default_reciter: reciter id */
  reciter_id?: string;
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
      body.action === "cancel_admin_request" ||
      body.action === "update_row" ||
      body.action === "update_user_profile" ||
      body.action === "update_user_settings" ||
      body.action === "set_default_reciter";

    if (isMutation && !callerIsAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden — only admins can change roles or delete users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Listing users (and admin requests) is allowed for admins and moderators.
    if (
      ((body.action === "list_users" || body.action === "list_admin_requests" || body.action === "validate_recitation_reciters")) &&
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

    if (body.action === "validate_recitation_reciters") {
      const sampleLimit = Math.min(200, Math.max(1, Number(body.sample_limit ?? 25) || 25));
      const sinceIso = typeof body.since === "string" && !Number.isNaN(Date.parse(body.since))
        ? new Date(body.since).toISOString()
        : null;

      // 1. Total session count in scope
      let totalQuery = admin
        .from("recitation_sessions")
        .select("*", { count: "exact", head: true });
      if (sinceIso) totalQuery = totalQuery.gte("created_at", sinceIso);
      const { count: totalCount, error: totalErr } = await totalQuery;
      if (totalErr) throw totalErr;

      // 2. Null reciter
      let nullQuery = admin
        .from("recitation_sessions")
        .select("*", { count: "exact", head: true })
        .is("reciter", null);
      if (sinceIso) nullQuery = nullQuery.gte("created_at", sinceIso);
      const { count: nullCount, error: nullErr } = await nullQuery;
      if (nullErr) throw nullErr;

      // 3. Sentinel/empty values ("unknown", "", "null", "undefined")
      const sentinels = Array.from(RECITER_SENTINEL_INVALID);
      let sentinelQuery = admin
        .from("recitation_sessions")
        .select("*", { count: "exact", head: true })
        .in("reciter", sentinels);
      if (sinceIso) sentinelQuery = sentinelQuery.gte("created_at", sinceIso);
      const { count: sentinelCount, error: sentinelErr } = await sentinelQuery;
      if (sentinelErr) throw sentinelErr;

      // 4. Unknown / non-canonical values: pull a bounded breakdown grouped client-side
      let breakdownQuery = admin
        .from("recitation_sessions")
        .select("reciter")
        .not("reciter", "is", null)
        .not("reciter", "in", `(${sentinels.map((s) => `"${s}"`).join(",")})`)
        .limit(10000);
      if (sinceIso) breakdownQuery = breakdownQuery.gte("created_at", sinceIso);
      const { data: nonNullRows, error: brErr } = await breakdownQuery;
      if (brErr) throw brErr;

      const valueCounts = new Map<string, number>();
      let unknownReciterCount = 0;
      let knownReciterCount = 0;
      for (const row of nonNullRows ?? []) {
        const r = (row as { reciter: string | null }).reciter;
        if (typeof r !== "string") continue;
        valueCounts.set(r, (valueCounts.get(r) ?? 0) + 1);
        if (KNOWN_RECITER_IDS.has(r)) knownReciterCount += 1;
        else unknownReciterCount += 1;
      }

      const unknownBreakdown = Array.from(valueCounts.entries())
        .filter(([id]) => !KNOWN_RECITER_IDS.has(id))
        .sort((a, b) => b[1] - a[1])
        .slice(0, sampleLimit)
        .map(([reciter, count]) => ({ reciter, count }));

      const knownBreakdown = Array.from(valueCounts.entries())
        .filter(([id]) => KNOWN_RECITER_IDS.has(id))
        .sort((a, b) => b[1] - a[1])
        .map(([reciter, count]) => ({ reciter, count }));

      // 5. Recent invalid samples (most useful for ops to trace bad clients)
      let samplesQuery = admin
        .from("recitation_sessions")
        .select("id, user_id, created_at, surah, ayah, mode, reciter")
        .order("created_at", { ascending: false })
        .limit(sampleLimit);
      const sampleFilter = `reciter.is.null,reciter.in.(${sentinels.map((s) => `"${s}"`).join(",")})`;
      samplesQuery = samplesQuery.or(sampleFilter);
      if (sinceIso) samplesQuery = samplesQuery.gte("created_at", sinceIso);
      const { data: samples, error: sampErr } = await samplesQuery;
      if (sampErr) throw sampErr;

      const total = totalCount ?? 0;
      const missing = (nullCount ?? 0) + (sentinelCount ?? 0);
      const invalid = missing + unknownReciterCount;
      const validPercent = total > 0
        ? Math.round(((total - invalid) / total) * 10000) / 100
        : 100;

      return new Response(
        JSON.stringify({
          scanned_at: new Date().toISOString(),
          since: sinceIso,
          totals: {
            sessions: total,
            valid: Math.max(0, total - invalid),
            invalid,
            missing_null: nullCount ?? 0,
            missing_sentinel: sentinelCount ?? 0,
            unknown_reciter: unknownReciterCount,
            known_reciter: knownReciterCount,
            valid_percent: validPercent,
          },
          known_breakdown: knownBreakdown,
          unknown_breakdown: unknownBreakdown,
          recent_invalid_samples: samples ?? [],
          known_reciter_ids: Array.from(KNOWN_RECITER_IDS),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ───────────────────── Admin direct edit endpoints ─────────────────────

    const ROW_TABLE_FIELDS: Record<string, string[]> = {
      recitation_sessions: ["accuracy", "correct_words", "error_words", "hesitation_words", "mode", "reciter", "lesson_type", "duration_ms", "surah", "ayah", "total_words"],
      recitation_word_stats: ["attempts", "correct", "errors", "hesitations"],
      bookmarks_sync: ["note", "surah", "ayah"],
      hifz_srs: ["ease_factor", "interval_days", "repetitions", "next_review_at", "last_quality"],
      qaza_sync: ["fajr", "dhuhr", "asr", "maghrib", "isha", "witr"],
      profiles: ["display_name", "avatar_url"],
    };

    const sanitizePatch = (table: string, patch: Record<string, unknown>) => {
      const allow = ROW_TABLE_FIELDS[table];
      if (!allow) return null;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(patch ?? {})) {
        if (allow.includes(k)) out[k] = patch[k];
      }
      return out;
    };

    if (body.action === "update_row") {
      if (!body.table || !body.row_id || !body.patch) {
        return new Response(JSON.stringify({ error: "table, row_id and patch required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const clean = sanitizePatch(body.table, body.patch);
      if (!clean) {
        return new Response(JSON.stringify({ error: "Table not editable" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await admin.from(body.table).update(clean).eq("id", body.row_id);
      if (error) throw error;
      await admin.from("audit_logs").insert({
        actor_id: callerId, action: `${body.table}.admin_update`,
        target_type: body.table, target_id: body.row_id, metadata: { fields: Object.keys(clean) },
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "update_user_profile") {
      if (!body.user_id || !body.patch) {
        return new Response(JSON.stringify({ error: "user_id and patch required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const clean = sanitizePatch("profiles", body.patch);
      if (!clean || Object.keys(clean).length === 0) {
        return new Response(JSON.stringify({ error: "No editable fields in patch" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await admin.from("profiles").update(clean).eq("user_id", body.user_id);
      if (error) throw error;
      await admin.from("audit_logs").insert({
        actor_id: callerId, action: "profile.admin_update",
        target_type: "user", target_id: body.user_id, metadata: { fields: Object.keys(clean) },
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "update_user_settings") {
      if (!body.user_id || !body.patch) {
        return new Response(JSON.stringify({ error: "user_id and patch required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: existing } = await admin
        .from("user_settings").select("settings").eq("user_id", body.user_id).maybeSingle();
      const merged = { ...(existing?.settings ?? {}), ...(body.patch as Record<string, unknown>) };
      if (existing) {
        const { error } = await admin.from("user_settings")
          .update({ settings: merged }).eq("user_id", body.user_id);
        if (error) throw error;
      } else {
        const { error } = await admin.from("user_settings")
          .insert({ user_id: body.user_id, settings: merged });
        if (error) throw error;
      }
      await admin.from("audit_logs").insert({
        actor_id: callerId, action: "user_settings.admin_update",
        target_type: "user", target_id: body.user_id, metadata: { keys: Object.keys(body.patch) },
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "set_default_reciter") {
      if (!body.reciter_id) {
        return new Response(JSON.stringify({ error: "reciter_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: clearErr } = await admin.from("reciters")
        .update({ is_default: false }).eq("is_default", true);
      if (clearErr) throw clearErr;
      const { error: setErr } = await admin.from("reciters")
        .update({ is_default: true }).eq("id", body.reciter_id);
      if (setErr) throw setErr;
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
    console.error("admin-users error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
