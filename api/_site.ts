/**
 * Shared helpers for the two edge functions that give published sites a social preview
 * (the card shown when a link is posted on X, Threads, WhatsApp, Facebook, LinkedIn…).
 * Pure functions only: the handlers pass in the environment, so these can be unit tested.
 */

export interface SiteInfo {
  subdomain: string;
  title: string;
  name: string;
  tagline: string;
  photoUrl: string | null;
  accent: string;
  bg: string;
  ink: string;
  version: number;
}

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])$/;

/** "jane" for jane.<rootDomain> or /s/jane, otherwise null (the main Fablebook app, www, assets…). */
export function siteFromRequest(host: string, pathname: string, rootDomain: string): string | null {
  const m = /^\/s\/([^/]+)/.exec(pathname);
  if (m) {
    const name = decodeURIComponent(m[1]).toLowerCase();
    return SUBDOMAIN_RE.test(name) ? name : null;
  }
  const root = rootDomain.trim().toLowerCase();
  const h = host.split(":")[0].toLowerCase();
  if (!root || !h.endsWith(`.${root}`)) return null;
  const name = h.slice(0, -root.length - 1);
  if (!name || name === "www" || name.includes(".")) return null;
  return SUBDOMAIN_RE.test(name) ? name : null;
}

export const clip = (text: string, max: number): string => {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
};

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const color = (v: unknown, fallback: string) => (typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v.trim()) ? v.trim() : fallback);

interface Row {
  subdomain: string;
  title: string | null;
  author_name: string | null;
  updated_at: string | null;
  doc: unknown;
}
interface AuthorRow {
  name: string | null;
  photo_url: string | null;
  avatar_url: string | null;
}

/** Turns the saved site and the author's profile into what the preview needs. Only allows photos hosted in our own Supabase storage. */
export function buildSiteInfo(row: Row, author: AuthorRow | null, supabaseUrl: string): SiteInfo {
  const doc = (row.doc && typeof row.doc === "object" ? row.doc : {}) as { theme?: Record<string, unknown>; blocks?: Record<string, unknown>[] };
  const blocks = Array.isArray(doc.blocks) ? doc.blocks : [];
  const footer = blocks.find((b) => b?.type === "footer");
  const hero = blocks.find((b) => b?.type === "hero");
  const name = str(row.author_name) || str(author?.name) || str(footer?.title) || row.subdomain;
  const tagline =
    [str(hero?.title), str(hero?.text)].filter(Boolean)[0] ||
    str(blocks.find((b) => b?.type !== "header" && b?.type !== "announce" && b?.type !== "footer" && str(b?.title))?.title) ||
    "";
  const allowed = `${supabaseUrl.replace(/\/+$/, "")}/storage/`;
  const photo = [author?.photo_url, author?.avatar_url].map((u) => (typeof u === "string" ? u.trim() : "")).find((u) => u && supabaseUrl && u.startsWith(allowed));
  const t = doc.theme ?? {};
  return {
    subdomain: row.subdomain,
    title: str(row.title) || name,
    name,
    tagline: clip(tagline, 120),
    photoUrl: photo ?? null,
    accent: color(t.accent, "#d4a64a"),
    bg: color(t.bg, "#14110f"),
    ink: color(t.ink, "#f5efe6"),
    version: row.updated_at ? Date.parse(row.updated_at) || 0 : 0,
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Puts the site's own title, description and preview image into the app's index.html so crawlers (which don't run JavaScript) see them. */
export function injectMeta(html: string, site: SiteInfo, origin: string, pageUrl: string): string {
  const image = `${origin}/api/og?site=${encodeURIComponent(site.subdomain)}&v=${site.version}`;
  const description = clip(site.tagline ? `${site.name} — ${site.tagline}` : `The official website of ${site.name}.`, 160);
  const tags = [
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(site.title)}" />`,
    `<meta property="og:title" content="${esc(site.title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(pageUrl)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(`${site.name}'s website`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(site.title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<meta name="theme-color" content="${esc(site.bg)}" />`,
  ].join("\n    ");
  return html
    .replace(/<title>[^<]*<\/title>/i, `<title>${esc(site.title)}</title>`)
    .replace(/<meta\s+name="description"[^>]*>\s*/i, "")
    .replace(/<meta\s+name="theme-color"[^>]*>\s*/i, "")
    .replace(/<\/head>/i, `    ${tags}\n  </head>`);
}

/** Loads one published site and its author's photo through Supabase's public REST API. Null when the site doesn't exist. */
export async function loadSiteInfo(subdomain: string, supabaseUrl: string, anonKey: string): Promise<SiteInfo | null> {
  if (!supabaseUrl || !anonKey) return null;
  const base = supabaseUrl.replace(/\/+$/, "");
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
  const siteRes = await fetch(
    `${base}/rest/v1/published_sites?subdomain=eq.${encodeURIComponent(subdomain)}&select=subdomain,title,author_name,updated_at,doc,user_id&limit=1`,
    { headers },
  );
  if (!siteRes.ok) return null;
  const rows = (await siteRes.json()) as (Row & { user_id: string })[];
  const row = rows[0];
  if (!row) return null;
  let author: AuthorRow | null = null;
  try {
    const a = await fetch(`${base}/rest/v1/authors?user_id=eq.${encodeURIComponent(row.user_id)}&select=name,photo_url,avatar_url&limit=1`, { headers });
    if (a.ok) author = ((await a.json()) as AuthorRow[])[0] ?? null;
  } catch {
    /* no photo is fine: the card uses the author's initial */
  }
  return buildSiteInfo(row, author, base);
}
