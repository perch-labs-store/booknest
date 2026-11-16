// Clerk webhook: creates / removes the author row in Supabase when a user signs up or is deleted.
// Clerk Dashboard -> Webhooks -> Endpoint URL: https://<your domain>/api/webhooks/clerk
// Events: user.created, user.deleted.  Env vars (Vercel, NOT VITE_): CLERK_WEBHOOK_SECRET (whsec_…), SUPABASE_SERVICE_ROLE_KEY.
// Run supabase/clerk-webhook.sql first.
export const config = { runtime: "edge" };

declare const process: { env: Record<string, string | undefined> };

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Svix signature check (what Clerk uses): HMAC-SHA256 of `${id}.${timestamp}.${body}`. */
async function verify(body: string, h: Headers, secret: string): Promise<boolean> {
  const id = h.get("svix-id"), ts = h.get("svix-timestamp"), sig = h.get("svix-signature");
  if (!id || !ts || !sig || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", b64(secret.replace(/^whsec_/, "")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
  const expected = btoa(String.fromCharCode(...mac));
  return sig.split(" ").some((p) => p.split(",")[1] === expected);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const env = process.env;
  const secret = env.CLERK_WEBHOOK_SECRET, service = env.SUPABASE_SERVICE_ROLE_KEY;
  const base = (env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
  if (!secret || !service || !base) return new Response("Webhook not configured", { status: 500 });

  const body = await req.text();
  let ok = false;
  try { ok = await verify(body, req.headers, secret); } catch { /* bad secret or headers */ }
  if (!ok) return new Response("Invalid signature", { status: 400 });

  const evt = JSON.parse(body) as { type: string; data: { id?: string; first_name?: string | null; last_name?: string | null; username?: string | null } };
  const rpc = (fn: string, args: object) =>
    fetch(`${base}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: service, Authorization: `Bearer ${service}`, "content-type": "application/json" },
      body: JSON.stringify(args),
    });

  let res: Response | null = null;
  if (evt.type === "user.created" && evt.data.id) {
    const d = evt.data;
    const name = [d.first_name, d.last_name].filter(Boolean).join(" ") || d.username || "";
    res = await rpc("create_author_for_user", { p_user_id: d.id, p_name: name });
  } else if (evt.type === "user.deleted" && evt.data.id) {
    res = await rpc("delete_author_for_user", { p_user_id: evt.data.id });
  }
  if (res && !res.ok) {
    console.error("[Fablebook] clerk webhook failed", evt.type, res.status, await res.text());
    return new Response("Database error", { status: 500 }); // Clerk will retry
  }
  return new Response("ok");
}