// The preview image (1200x630) for an author's website: their photo, name and a line about the site.
// /api/og?site=jane. Everything shown is read from the database, never from the address, so nobody can make a card say what they like.
import { ImageResponse } from "@vercel/og";
import { clip, loadSiteInfo, type SiteInfo } from "./_site";

declare const process: { env: Record<string, string | undefined> };
export const config = { runtime: "edge" };

const readable = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f.slice(0, 6), 16);
  if (Number.isNaN(n)) return "#ffffff";
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62 ? "#1a1a1a" : "#ffffff";
};

/** Downloads the photo and returns it as a data URI. Only JPEG and PNG are drawable; anything else falls back to the initial. */
async function photoDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length > 4_000_000) return null;
    const mime = buf[0] === 0xff && buf[1] === 0xd8 ? "image/jpeg" : buf[0] === 0x89 && buf[1] === 0x50 ? "image/png" : null;
    if (!mime) return null;
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return `data:${mime};base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): El => ({
  type,
  props: { style: { display: "flex", boxSizing: "border-box", ...style }, children, ...extra },
});

export function card(site: SiteInfo, photo: string | null, host: string): El {
  const size = 330;
  const avatar = photo
    ? h("div", { width: size, height: size, borderRadius: size, padding: 8, backgroundColor: site.accent, flexShrink: 0 }, {
        type: "img",
        props: { src: photo, width: size - 16, height: size - 16, style: { objectFit: "cover", width: size - 16, height: size - 16, borderRadius: size } },
      })
    : h(
        "div",
        { width: size, height: size, borderRadius: size, backgroundColor: site.accent, color: readable(site.accent), alignItems: "center", justifyContent: "center", fontSize: 150, fontWeight: 700, flexShrink: 0 },
        (site.name.trim()[0] ?? "?").toUpperCase(),
      );
  const nameSize = site.name.length > 22 ? 64 : 82;
  return h(
    "div",
    { width: "100%", height: "100%", backgroundColor: site.bg, color: site.ink, padding: "60px 72px", flexDirection: "column", justifyContent: "space-between" },
    [
      h("div", { width: 120, height: 10, borderRadius: 5, backgroundColor: site.accent }),
      h("div", { alignItems: "center", gap: 64 }, [
        avatar,
        h("div", { flexDirection: "column", flex: 1, minWidth: 0 }, [
          h("div", { fontSize: nameSize, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }, clip(site.name, 40)),
          site.tagline ? h("div", { marginTop: 26, fontSize: 36, lineHeight: 1.3, opacity: 0.75 }, clip(site.tagline, 100)) : "",
        ]),
      ]),
      h("div", { fontSize: 30, fontWeight: 600, color: site.accent }, host),
    ],
  );
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const sub = (url.searchParams.get("site") ?? "").toLowerCase();
  const env = process.env;
  const site = /^[a-z0-9-]{3,32}$/.test(sub) ? await loadSiteInfo(sub, env.VITE_SUPABASE_URL ?? "", env.VITE_SUPABASE_ANON_KEY ?? "") : null;
  if (!site) return new Response("Not found", { status: 404, headers: { "cache-control": "public, s-maxage=60" } });

  const photo = site.photoUrl ? await photoDataUri(site.photoUrl) : null;
  const root = env.VITE_ROOT_DOMAIN?.trim();
  return new ImageResponse(card(site, photo, root ? `${site.subdomain}.${root}` : url.host) as never, {
    width: 1200,
    height: 630,
    headers: { "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
