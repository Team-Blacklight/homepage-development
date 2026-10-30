import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers });

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." });

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return reply(503, { error: "Staff invitation service is not configured." });

  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return reply(401, { error: "Sign in and verify your email before redeeming this invitation." });

  const userClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await userClient.auth.getUser();
  if (authError || !auth.user?.email) return reply(401, { error: "A verified signed-in account is required." });
  if (!auth.user.email_confirmed_at) return reply(403, { error: "Verify your email address before redeeming this invitation." });

  let body: { invitation_token?: unknown };
  try { body = await request.json(); } catch { return reply(400, { error: "Invalid request." }); }
  const raw = typeof body.invitation_token === "string" ? body.invitation_token : "";
  if (!/^[a-f0-9]{64}$/.test(raw)) return reply(400, { error: "Invalid invitation token." });

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  const { data, error } = await admin.rpc("redeem_staff_invite", {
    p_token_hash: hash,
    p_user_id: auth.user.id,
    p_email: auth.user.email
  });
  if (error) {
    console.error("Staff invite redemption failed:", error.message);
    return reply(500, { error: "Could not redeem the invitation. Contact Team Blacklight support." });
  }
  if (data !== true) return reply(400, { error: "This invitation is invalid, expired, already used, or belongs to a different email address." });
  return reply(200, { success: true, account_type: "staff" });
});
