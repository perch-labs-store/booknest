// Runs before files are served. Only author sites (name.<domain> or /s/name) are sent through api/site.ts so that
// social apps see their title and preview image. Everything else, including the main Fablebook app, passes straight through.
//
// Deliberately self-contained (no imports, nothing that can throw outside the try block): if this file fails to load or
// throws, Vercel answers every request with MIDDLEWARE_INVOCATION_FAILED, which takes the whole site down for anyone
// whose browser doesn't already have the app cached (Threads, X, WhatsApp, new visitors...).

export const config = {
  matcher: ["/((?!assets/|icons/|demo-covers/|api/|index\\.html|sw\\.js|workbox-.*|push-sw\\.js|registerSW\\.js|manifest.*|favicon\\.svg).*)"],
};

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])$/;

// Same rule as siteFromRequest in api/_site.ts: "jane" for jane.<rootDomain> or /s/jane, otherwise null.
function siteName(host: string, pathname: string, rootDomain: string): string | null {
  const m = /^\/s\/([^/]+)/.exec(pathname);
  if (m) {
    let name: string;
    try {
      name = decodeURIComponent(m[1]).toLowerCase();
    } catch {
      return null;
    }
    return SUBDOMAIN_RE.test(name) ? name : null;
  }
  const root = rootDomain.trim().toLowerCase();
  const h = host.split(":")[0].toLowerCase();
  if (!root || !h.endsWith(`.${root}`)) return null;
  const name = h.slice(0, -root.length - 1);
  if (!name || name === "www" || name.includes(".")) return null;
  return SUBDOMAIN_RE.test(name) ? name : null;
}

function next(): Response {
  return new Response(null, { headers: { "x-middleware-next": "1" } });
}

export default function middleware(req: Request): Response {
  try {
    if (req.headers.get("x-fb-internal")) return next();
    const url = new URL(req.url);
    let root = "";
    try {
      root = (typeof process !== "undefined" && process.env?.VITE_ROOT_DOMAIN) || "";
    } catch {
      root = "";
    }
    if (!siteName(req.headers.get("host") ?? url.host, url.pathname, root)) return next();
    return new Response(null, { headers: { "x-middleware-rewrite": new URL("/api/site", url.origin).toString() } });
  } catch {
    return next();
  }
}