// Clerk webhook -> creates / removes the author row when a user signs up or is deleted.
// Deploy:  supabase functions deploy clerk-webhook --no-verify-jwt
// Secret (already set by you):  CLERK_WEBHOOK_SIGNING_SECRET  (whsec_… from the Clerk endpoint page)
// Clerk endpoint URL:  https://<project-ref>.supabase.co/functions/v1/clerk-webhook   Events: user.created, user.deleted
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically. Run supabase/clerk-webhook.sql first.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function verify(body: string, h: Headers, secret: string): Promise<boolean> {
  const id = h.get("svix-id"), ts = h.get("svix-timestamp"), sig = h.get("svix-signature");
  if (!id || !ts || !sig || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", b64(secret.replace(/^whsec_/, "")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
  const expected = btoa(String.fromCharCode(...mac));
  return sig.split(" ").some((p) => p.split(",")[1] === expected);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("CLERK_WEBHOOK_SIGNING_SECRET");
  if (!secret) return new Response("Webhook secret not set", { status: 500 });

  const body = await req.text();
  let ok = false;
  try { ok = await verify(body, req.headers, secret); } catch { /* malformed secret or headers */ }
  if (!ok) return new Response("Invalid signature", { status: 400 });

  const evt = JSON.parse(body) as { type: string; data: { id?: string; first_name?: string | null; last_name?: string | null; username?: string | null } };
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  let error = null;
  if (evt.type === "user.created" && evt.data.id) {
    const d = evt.data;
    const name = [d.first_name, d.last_name].filter(Boolean).join(" ") || d.username || "";
    ({ error } = await sb.rpc("create_author_for_user", { p_user_id: d.id, p_name: name }));
  } else if (evt.type === "user.deleted" && evt.data.id) {
    ({ error } = await sb.rpc("delete_author_for_user", { p_user_id: evt.data.id }));
  }
  if (error) {
    console.error("clerk-webhook failed", evt.type, error.message);
    return new Response("Database error", { status: 500 }); // Clerk retries
  }
  return new Response("ok");
});
