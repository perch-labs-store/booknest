import { describe, expect, it } from "vitest";
import { buildSiteInfo, injectMeta, siteFromRequest } from "../../api/_site";
import middleware from "../../middleware";

const SB = "https://abc.supabase.co";
const row = (over = {}) => ({
  subdomain: "jane",
  title: "Jane Doe",
  author_name: "Jane Doe",
  updated_at: "2026-11-01T10:00:00Z",
  doc: { theme: { accent: "#c0392b", bg: "#101010", ink: "#fafafa" }, blocks: [{ type: "hero", title: "Stories that stay with you", text: "x" }, { type: "footer", title: "Jane Doe" }] },
  ...over,
});

describe("siteFromRequest", () => {
  it("reads the site from the host or the /s/ path", () => {
    expect(siteFromRequest("jane.fablebook.store", "/", "fablebook.store")).toBe("jane");
    expect(siteFromRequest("jane.fablebook.store:443", "/", "fablebook.store")).toBe("jane");
    expect(siteFromRequest("fablebook.store", "/", "fablebook.store")).toBeNull();
    expect(siteFromRequest("www.fablebook.store", "/", "fablebook.store")).toBeNull();
    expect(siteFromRequest("a.b.fablebook.store", "/", "fablebook.store")).toBeNull();
    expect(siteFromRequest("fablebook.store", "/s/Jane", "fablebook.store")).toBe("jane");
    expect(siteFromRequest("x.vercel.app", "/books/x", "fablebook.store")).toBeNull();
    expect(siteFromRequest("jane.fablebook.store", "/", "")).toBeNull();
  });
});

describe("buildSiteInfo", () => {
  it("uses the author's photo only from our own storage", () => {
    const ok = buildSiteInfo(row(), { name: "J", photo_url: `${SB}/storage/v1/object/public/avatars/a.jpg`, avatar_url: null }, SB);
    expect(ok.photoUrl).toContain("/storage/");
    const bad = buildSiteInfo(row(), { name: "J", photo_url: "http://169.254.169.254/x.jpg", avatar_url: "https://evil.com/a.jpg" }, SB);
    expect(bad.photoUrl).toBeNull();
    const fallback = buildSiteInfo(row(), { name: "J", photo_url: null, avatar_url: `${SB}/storage/v1/object/public/avatars/b.jpg` }, SB);
    expect(fallback.photoUrl).toContain("b.jpg");
  });
  it("takes the tagline from the hero and colours from the theme, and survives junk", () => {
    const s = buildSiteInfo(row(), null, SB);
    expect(s.tagline).toBe("Stories that stay with you");
    expect(s.accent).toBe("#c0392b");
    const junk = buildSiteInfo(row({ doc: "nope", title: null, author_name: null }), null, SB);
    expect(junk.name).toBe("jane");
    expect(junk.accent).toBe("#d4a64a");
  });
});

describe("injectMeta", () => {
  const html = `<html><head><title>Fablebook</title><meta name="description" content="old" /><meta name="theme-color" content="#0B0B0D" /></head><body></body></html>`;
  it("adds title, description and a large preview image", () => {
    const site = buildSiteInfo(row({ title: `Jane "<b>" Doe` }), null, SB);
    const out = injectMeta(html, site, "https://jane.fablebook.store", "https://jane.fablebook.store/");
    expect(out).toContain("<title>Jane &quot;&lt;b&gt;&quot; Doe</title>");
    expect(out).toContain('property="og:image" content="https://jane.fablebook.store/api/og?site=jane&amp;v=');
    expect(out).toContain('name="twitter:card" content="summary_large_image"');
    expect(out.match(/name="description"/g)).toHaveLength(1);
    expect(out.match(/name="theme-color"/g)).toHaveLength(1);
    expect(out).not.toContain("content=\"old\"");
  });
});

describe("middleware", () => {
  const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });
  it("rewrites author sites and leaves everything else alone", () => {
    process.env.VITE_ROOT_DOMAIN = "fablebook.store";
    expect(middleware(req("https://jane.fablebook.store/", { host: "jane.fablebook.store" })).headers.get("x-middleware-rewrite")).toBe("https://jane.fablebook.store/api/site");
    expect(middleware(req("https://fablebook.store/templates", { host: "fablebook.store" })).headers.get("x-middleware-next")).toBe("1");
    expect(middleware(req("https://jane.fablebook.store/index.html", { host: "jane.fablebook.store", "x-fb-internal": "1" })).headers.get("x-middleware-next")).toBe("1");
  });
});
