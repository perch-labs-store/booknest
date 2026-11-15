// Runs before files are served. Only author sites (name.<domain> or /s/name) are sent through api/site.ts so that
// social apps see their title and preview image. Everything else, including the main Fablebook app, passes straight through.
import { siteFromRequest } from "./api/_site";

declare const process: { env: Record<string, string | undefined> };

export const config = {
  matcher: ["/((?!assets/|icons/|demo-covers/|api/|index\\.html|sw\\.js|workbox-.*|push-sw\\.js|registerSW\\.js|manifest.*|favicon\\.svg).*)"],
};

export default function middleware(req: Request): Response {
  const url = new URL(req.url);
  const pass = new Response(null, { headers: { "x-middleware-next": "1" } });
  try {
    if (req.headers.get("x-fb-internal")) return pass;
    if (!siteFromRequest(req.headers.get("host") ?? url.host, url.pathname, process.env.VITE_ROOT_DOMAIN ?? "")) return pass;
    const target = new URL("/api/site", url.origin);
    return new Response(null, { headers: { "x-middleware-rewrite": target.toString() } });
  } catch {
    return pass;
  }
}
