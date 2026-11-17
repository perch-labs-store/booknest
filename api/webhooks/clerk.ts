// Clerk webhook (user.created / user.deleted) -> creates or removes the author row in Supabase.
// Endpoint URL in Clerk:  https://<your-domain>/api/webhooks/clerk
// Vercel environment variables (Production), then redeploy:
//   CLERK_WEBHOOK_SIGNING_SECRET   whsec_… from the Clerk endpoint page
//   SUPABASE_SERVICE_ROLE_KEY      Supabase -> Project Settings -> API -> service_role (server only, never a VITE_ variable)
//   VITE_SUPABASE_URL              already set for the app (SUPABASE_URL also works)
// Run supabase/clerk-webhook.sql once first. No extra packages: the Svix signature is checked with Web Crypto.
declare const process: { env: Record<string, string | undefined> };
export const config = { runtime: "edge" };

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function verify(body: string, h: Headers, secret: string): Promise<boolean> {
  const id = h.get("svix-id"), ts = h.get("svix-timestamp"), sig = h.get("svix-signature");
  if (!id || !ts || !sig || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", b64(secret.replace(/^whsec_/, "")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
  const expected = btoa(String.fromCharCode(...mac));
  return sig.split(" ").some((p) => p.split(",")[1] === expected);
}

interface ClerkEvent {
  type: string;
  data: { id?: string; first_name?: string | null; last_name?: string | null; username?: string | null };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const env = process.env;
  const secret = env.CLERK_WEBHOOK_SIGNING_SECRET;
  const supabaseUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  // Say exactly which variable is missing (names only, never values) so the Clerk "Message Attempts" page shows it.
  const missing = [
    !secret && "CLERK_WEBHOOK_SIGNING_SECRET",
    !supabaseUrl && "SUPABASE_URL or VITE_SUPABASE_URL",
    !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);
  if (missing.length) return new Response(`Webhook not configured. Missing: ${missing.join(", ")}`, { status: 500 });

  const body = await req.text();
  let ok = false;
  try { ok = await verify(body, req.headers, secret!); } catch { /* malformed secret or headers */ }
  if (!ok) return new Response("Invalid signature", { status: 400 });

  let evt: ClerkEvent;
  try { evt = JSON.parse(body) as ClerkEvent; } catch { return new Response("Bad payload", { status: 400 }); }

  let fn: string | null = null;
  let args: Record<string, string> = {};
  if (evt.type === "user.created" && evt.data.id) {
    const d = evt.data;
    fn = "create_author_for_user";
    args = { p_user_id: d.id!, p_name: [d.first_name, d.last_name].filter(Boolean).join(" ") || d.username || "" };
  } else if (evt.type === "user.deleted" && evt.data.id) {
    fn = "delete_author_for_user";
    args = { p_user_id: evt.data.id };
  }
  if (!fn) return new Response("ignored"); // other event types: acknowledge so Clerk doesn't retry

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: serviceKey!, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("clerk-webhook failed", evt.type, res.status, detail);
    return new Response(`Database error ${res.status}: ${detail}`, { status: 500 }); // Clerk retries
  }
  return new Response("ok");
}