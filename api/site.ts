// Serves the app's index.html with the author's own title, description and preview image, for crawlers.
// Reached through middleware.ts, only for author sites (name.<domain> or /s/name).
import { injectMeta, loadSiteInfo, siteFromRequest } from "./_site";

declare const process: { env: Record<string, string | undefined> };
export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const env = process.env;
  const shellRes = await fetch(new URL("/index.html", url.origin), { headers: { "x-fb-internal": "1" } });
  const shell = await shellRes.text();
  const headers = { "content-type": "text/html; charset=utf-8" };

  try {
    const sub = siteFromRequest(req.headers.get("host") ?? url.host, url.pathname, env.VITE_ROOT_DOMAIN ?? "");
    const site = sub ? await loadSiteInfo(sub, env.VITE_SUPABASE_URL ?? "", env.VITE_SUPABASE_ANON_KEY ?? "") : null;
    if (site) {
      const pageUrl = `${url.origin}${url.pathname}`;
      return new Response(injectMeta(shell, site, url.origin, pageUrl), {
        headers: { ...headers, "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" },
      });
    }
  } catch (e) {
    console.error("[Fablebook] site meta failed", e);
  }
  // Unknown site or any problem: the normal app still loads and shows its own message.
  return new Response(shell, { headers: { ...headers, "cache-control": "public, s-maxage=30" } });
}
