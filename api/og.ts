// The preview image (1200x630 PNG) for an author's website: their photo, name and a line about the site.
// /api/og?site=jane. Everything shown is read from the database, never from the address, so nobody can make a card say what they like.
// Runs as a normal Node function (satori draws the layout, resvg turns it into a PNG).
import { readFileSync } from "node:fs";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { card } from "./_card.js";
import { loadSiteInfo } from "./_site.js";

declare const process: { env: Record<string, string | undefined> };
declare const Buffer: { from(data: ArrayBuffer | Uint8Array): { toString(enc: string): string } };

interface Req {
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): Res;
  send(body: unknown): void;
}

const font = readFileSync(new URL("./_fonts/Geist-Regular.ttf", import.meta.url));

/** Downloads the photo and returns it as a data URI. Only JPEG and PNG are drawable; anything else falls back to the initial. */
async function photoDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length > 4_000_000) return null;
    const mime = buf[0] === 0xff && buf[1] === 0xd8 ? "image/jpeg" : buf[0] === 0x89 && buf[1] === 0x50 ? "image/png" : null;
    return mime ? `data:${mime};base64,${Buffer.from(buf).toString("base64")}` : null;
  } catch {
    return null;
  }
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const url = new URL(req.url ?? "/", "https://x.invalid");
  const sub = (url.searchParams.get("site") ?? "").toLowerCase();
  const env = process.env;
  const site = /^[a-z0-9-]{3,32}$/.test(sub) ? await loadSiteInfo(sub, env.VITE_SUPABASE_URL ?? "", env.VITE_SUPABASE_ANON_KEY ?? "") : null;
  if (!site) {
    res.status(404).setHeader("cache-control", "public, s-maxage=60").send("Not found");
    return;
  }

  const photo = site.photoUrl ? await photoDataUri(site.photoUrl) : null;
  const root = env.VITE_ROOT_DOMAIN?.trim();
  const host = root ? `${site.subdomain}.${root}` : String(req.headers.host ?? site.subdomain);
  const svg = await satori(card(site, photo, host) as never, {
    width: 1200,
    height: 630,
    fonts: [{ name: "Geist", data: font, weight: 400, style: "normal" }],
  });
  const png = new Resvg(svg).render().asPng();
  res
    .status(200)
    .setHeader("content-type", "image/png")
    .setHeader("cache-control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800")
    .send(png);
}
