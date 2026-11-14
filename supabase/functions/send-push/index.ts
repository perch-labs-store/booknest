// Sends a phone / desktop push whenever a row is added to `notifications`.
//
// Setup (once):
//   1. npx web-push generate-vapid-keys
//   2. supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com WEBHOOK_SECRET=<any long random string>
//   3. supabase functions deploy send-push --no-verify-jwt
//   4. Dashboard -> Database -> Webhooks -> Create: table `notifications`, event Insert,
//      type "Supabase Edge Functions" -> send-push, and add the HTTP header  x-webhook-secret: <the same WEBHOOK_SECRET>
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to Edge Functions automatically.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

interface NotificationRecord {
  id: number;
  user_id: string;
  type: string;
  title: string;
  detail: string | null;
  cover_url: string | null;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { record } = (await req.json()) as { type: string; record: NotificationRecord };
  if (!record?.user_id) return new Response("No record", { status: 400 });

  // Respect the "New follower alerts" switch in the author's settings.
  if (record.type === "follow") {
    const { data: me } = await db.from("authors").select("prefs").eq("user_id", record.user_id).maybeSingle();
    if ((me?.prefs as { followerAlerts?: boolean } | null)?.followerAlerts === false) return new Response("Muted");
  }

  const { data: subs } = await db.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", record.user_id);
  if (!subs?.length) return new Response("No devices");

  const payload = JSON.stringify({
    title: record.title,
    body: record.detail ?? "",
    tag: `booknest-${record.type}`,
    url: "/notifications",
  });

  const gone: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86_400 });
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.endpoint); // the user removed the app or revoked permission
        else console.error("push failed", code, (e as Error).message);
      }
    }),
  );
  if (gone.length) await db.from("push_subscriptions").delete().in("endpoint", gone);

  return new Response(`Sent to ${subs.length - gone.length} device(s)`);
});
