import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, service);

    // Verify caller is admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "list") {
      const { data: list, error } = await admin.auth.admin.listUsers({ perPage: 200 });
      if (error) return json({ error: error.message }, 500);
      const ids = list.users.map((u) => u.id);
      const { data: roles } = await admin.from("user_roles").select("user_id, role").in("user_id", ids);
      const { data: profiles } = await admin.from("profiles").select("id, full_name, avatar_url, phone").in("id", ids);
      const users = list.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        banned_until: (u as any).banned_until ?? null,
        roles: (roles || []).filter((r) => r.user_id === u.id).map((r) => r.role),
        profile: (profiles || []).find((p) => p.id === u.id) || null,
      }));
      return json({ users });
    }

    const targetId = body.user_id as string;
    if (!targetId) return json({ error: "user_id required" }, 400);
    if (targetId === userData.user.id && (action === "delete" || action === "ban" || action === "revoke-admin")) {
      return json({ error: "Cannot perform this action on your own account" }, 400);
    }

    if (action === "grant-admin") {
      const { error } = await admin.from("user_roles").insert({ user_id: targetId, role: "admin" });
      if (error && !error.message.includes("duplicate")) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "revoke-admin") {
      const { error } = await admin.from("user_roles").delete().eq("user_id", targetId).eq("role", "admin");
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "ban") {
      const duration = body.duration || "876000h"; // ~100 years
      const { error } = await admin.auth.admin.updateUserById(targetId, { ban_duration: duration } as any);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "unban") {
      const { error } = await admin.auth.admin.updateUserById(targetId, { ban_duration: "none" } as any);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});