import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function respond(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), { status, headers: corsHeaders });
}
function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond(405, { error: "Method not allowed." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM");
  const siteUrl = Deno.env.get("SITE_URL");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !emailFrom || !siteUrl) {
    return respond(503, { error: "Application email service is not fully configured. The application was not removed." });
  }

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return respond(401, { error: "Sign in with an authorized staff account first." });

  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: authData, error: authError } = await callerClient.auth.getUser();
  if (authError || !authData.user) return respond(401, { error: "Your session is invalid or expired. Sign in again." });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
  if (profileError || !profile || !["admin", "overseer"].includes(profile.role)) {
    return respond(403, { error: "Only Team Blacklight admins and overseers can send application decisions." });
  }

  let body: { application_id?: unknown; decision?: unknown };
  try { body = await request.json(); }
  catch { return respond(400, { error: "Invalid JSON request." }); }

  const applicationId = typeof body.application_id === "string" ? body.application_id : "";
  const decision = body.decision;
  if (!applicationId || !["accepted", "declined"].includes(String(decision))) {
    return respond(400, { error: "Provide an application ID and an accepted or declined decision." });
  }

  const { data: application, error: applicationError } = await adminClient
    .from("join_applications")
    .select("id,name,email,area,message,portfolio_url")
    .eq("id", applicationId).maybeSingle();
  if (applicationError) return respond(500, { error: "Could not load the application. It was not removed." });
  if (!application) return respond(404, { error: "Application not found. It may already have been processed." });
  if (!application.email || !String(application.email).includes("@")) {
    return respond(400, { error: "This application has no valid contact email. It was not removed." });
  }

  const name = String(application.name || "Applicant").trim().slice(0, 80);
  const safeName = escapeHtml(name);
  const accountUrl = siteUrl.replace(/\/+$/, "") + "/#account";
  const accepted = decision === "accepted";
  const subject = accepted
    ? "Your Team Blacklight application was accepted"
    : "Update on your Team Blacklight application";
  const text = accepted
    ? `Hello ${name},\n\nThank you for applying to Team Blacklight. We're pleased to let you know that your application has been accepted.\n\nTo continue, create your Team Blacklight account here: ${accountUrl}\n\nUse the email address that received this message, and follow the on-screen instructions to verify your email and set up two-step verification. Creating an account is the next step; it does not ask you to send payment.\n\n— Team Blacklight`
    : `Hello ${name},\n\nThank you for taking the time to apply to Team Blacklight and share your interests with us. After reviewing your application, we're unable to offer you a place at this time. We appreciate your interest and wish you the best with your projects.\n\n— Team Blacklight`;
  const html = accepted
    ? `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#e9e8ff;background:#090b16;padding:28px"><h1 style="color:#bd8cff">Team Blacklight</h1><p>Hello ${safeName},</p><p>Thank you for applying to Team Blacklight. We're pleased to let you know that your application has been <strong>accepted</strong>.</p><p>To continue, create your Team Blacklight account using the button below. Use the email address that received this message, then follow the instructions to verify your email and set up two-step verification.</p><p><a href="${escapeHtml(accountUrl)}" style="display:inline-block;background:#8b5cf6;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:bold">CREATE YOUR ACCOUNT</a></p><p>Creating an account is the next step; no payment is requested.</p><p>— Team Blacklight</p></div>`
    : `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#e9e8ff;background:#090b16;padding:28px"><h1 style="color:#bd8cff">Team Blacklight</h1><p>Hello ${safeName},</p><p>Thank you for taking the time to apply to Team Blacklight and share your interests with us.</p><p>After reviewing your application, we're unable to offer you a place at this time. We appreciate your interest and wish you the best with your projects.</p><p>— Team Blacklight</p></div>`;

  let emailResponse: Response;
  try {
    emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: emailFrom, to: [application.email], subject, text, html })
    });
  } catch {
    return respond(502, { error: "The email provider could not be reached. The application was kept for retry." });
  }
  if (!emailResponse.ok) {
    const providerMessage = (await emailResponse.text()).slice(0, 500);
    console.error("Resend rejected application decision email:", providerMessage);
    return respond(502, { error: "The email provider rejected the message. The application was kept for retry." });
  }

  const { data: deleted, error: deleteError } = await adminClient
    .from("join_applications").delete().eq("id", application.id).select("id").maybeSingle();
  if (deleteError || !deleted) {
    console.error("Decision email sent, but application cleanup failed:", deleteError?.message || "row not deleted");
    return respond(500, { error: "The email was sent, but the application could not be removed. Check the inbox before retrying to avoid a duplicate email." });
  }

  return respond(200, { success: true, decision, deleted: true });
});
