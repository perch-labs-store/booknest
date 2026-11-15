/**
 * The one place that knows the site's domain. Never hardcode a domain anywhere else.
 * Set VITE_ROOT_DOMAIN (e.g. "fablebook.store") in .env.local / your host's environment.
 */
export const ROOT_DOMAIN: string = import.meta.env.VITE_ROOT_DOMAIN?.trim().toLowerCase() || "";

/** Same shape the database accepts for a subdomain. */
export const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])$/;

const isLocalHost = () => {
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".localhost");
};

/**
 * The author site being visited: "jane" for jane.<ROOT_DOMAIN>, otherwise null.
 * Ignores "www" and the bare root domain. For testing without DNS, `?site=jane` also works.
 */
export function getSiteSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  const override = new URLSearchParams(window.location.search).get("site")?.trim().toLowerCase();
  if (override && SUBDOMAIN_RE.test(override)) return override;

  if (!ROOT_DOMAIN) return null;
  const host = window.location.hostname.toLowerCase();
  const suffix = `.${ROOT_DOMAIN}`;
  if (!host.endsWith(suffix)) return null; // also rules out the bare root domain
  const name = host.slice(0, -suffix.length);
  if (!name || name === "www" || name.includes(".")) return null;
  return SUBDOMAIN_RE.test(name) ? name : null;
}

/**
 * The address of a published site: https://<subdomain>.<ROOT_DOMAIN> in production. Without a root domain the
 * shareable link is the path form <origin>/s/<subdomain>; on localhost it is `?site=<subdomain>` (no DNS needed).
 */
export function siteUrl(subdomain: string): string {
  const name = subdomain.trim().toLowerCase();
  if (!ROOT_DOMAIN) return `${window.location.origin}/s/${encodeURIComponent(name)}`;
  if (isLocalHost()) return `${window.location.origin}/?site=${encodeURIComponent(name)}`;
  return `https://${name}.${ROOT_DOMAIN}`;
}

/** Short display form of the address, e.g. "jane.fablebook.store" (just "jane" when no root domain is set). */
export const siteHost = (subdomain: string): string => (ROOT_DOMAIN ? `${subdomain.trim().toLowerCase()}.${ROOT_DOMAIN}` : subdomain);
