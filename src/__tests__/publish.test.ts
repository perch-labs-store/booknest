// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeLink } from "../lib/safeLink";

const RESERVED = ["www", "app", "api", "admin", "mail", "ftp", "blog", "help", "support", "static", "assets", "cdn", "dev", "test", "staging", "status", "docs", "login", "auth", "dashboard", "billing", "ns1", "ns2", "smtp", "imap", "pop", "fablebook"];

describe("subdomainFor / isReservedSubdomain", () => {
  it("derives the address from a username", async () => {
    const { subdomainFor } = await import("../data/remote");
    expect(subdomainFor("Jane_Doe")).toBe("jane-doe");
    expect(subdomainFor("_abc_")).toBe("abc");
    expect(subdomainFor("JANE")).toBe("jane");
    expect(subdomainFor("author123")).toBe("author123");
    expect(subdomainFor("  Tom_99 ")).toBe("tom-99");
  });
  it("blocks every reserved name, and only those", async () => {
    const { isReservedSubdomain } = await import("../data/remote");
    for (const n of RESERVED) expect(isReservedSubdomain(n), n).toBe(true);
    expect(isReservedSubdomain("WWW")).toBe(true);
    for (const n of ["jane", "wwwx", "my-app", "authors"]) expect(isReservedSubdomain(n), n).toBe(false);
  });
});

describe("getSiteSubdomain (ROOT_DOMAIN = example.com)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });
  async function at(url: string, root = "example.com") {
    vi.stubEnv("VITE_ROOT_DOMAIN", root);
    vi.resetModules();
    window.history.replaceState({}, "", "/");
    const u = new URL(url);
    vi.stubGlobal("location", { hostname: u.hostname, search: u.search, origin: u.origin, href: u.href });
    return import("../lib/host");
  }
  it("jane.example.com -> jane", async () => expect((await at("https://jane.example.com/")).getSiteSubdomain()).toBe("jane"));
  it("www.example.com -> null", async () => expect((await at("https://www.example.com/")).getSiteSubdomain()).toBeNull());
  it("example.com -> null", async () => expect((await at("https://example.com/")).getSiteSubdomain()).toBeNull());
  it("localhost -> null", async () => expect((await at("http://localhost:5173/")).getSiteSubdomain()).toBeNull());
  it("localhost ?site=jane -> jane", async () => expect((await at("http://localhost:5173/?site=jane")).getSiteSubdomain()).toBe("jane"));
  it("evil.com -> null", async () => expect((await at("https://evil.com/")).getSiteSubdomain()).toBeNull());
  it("a.b.example.com -> null (only one level is a site)", async () => expect((await at("https://a.b.example.com/")).getSiteSubdomain()).toBeNull());
  it("jane.example.com.evil.com -> null", async () => expect((await at("https://jane.example.com.evil.com/")).getSiteSubdomain()).toBeNull());
  it("no root domain: only ?site= works", async () => {
    const m = await at("https://jane.example.com/", "");
    expect(m.getSiteSubdomain()).toBeNull();
  });
  it("siteUrl forms", async () => {
    expect((await at("https://example.com/")).siteUrl("Jane")).toBe("https://jane.example.com");
    expect((await at("http://localhost:5173/")).siteUrl("jane")).toBe("http://localhost:5173/?site=jane");
    expect((await at("https://x.app/", "")).siteUrl("jane")).toBe("https://x.app/s/jane");
  });
});

describe("sanitizeLink", () => {
  it("allows safe links", () => {
    expect(sanitizeLink("https://x.com")).toBe("https://x.com/");
    expect(sanitizeLink("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(sanitizeLink("tel:+123")).toBe("tel:+123");
    expect(sanitizeLink("example.com/buy")).toBe("https://example.com/buy");
  });
  it("rejects unsafe or empty links", () => {
    for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<b>x</b>", "", "   ", "vbscript:x", "https://user:pw@x.com", "//evil.com", null, 5]) {
      expect(sanitizeLink(bad as never), String(bad)).toBeNull();
    }
  });
});

describe("suggestUsername", () => {
  it("makes a clean address from a display name", async () => {
    const { suggestUsername } = await import("../lib/host");
    expect(suggestUsername("Jane O'Brien")).toBe("janeobrien");
    expect(suggestUsername("José Álvarez")).toBe("josealvarez");
    expect(suggestUsername("Al")).toBe("");
    expect(suggestUsername("A Very Long Author Name Indeed")).toBe("averylongauthornamei");
  });
});
