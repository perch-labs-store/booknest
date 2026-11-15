// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { buildDoc, footerHasTarget, footerLink, legalFromLabel, parseLegalHref, TEMPLATES, type Block } from "../data/templates";
import { siteIdentity } from "../components/SiteLegal";

describe("footer links", () => {
  it("maps legal labels to the built-in pages", () => {
    expect(legalFromLabel("Privacy")).toBe("privacy");
    expect(legalFromLabel("Privacy Policy")).toBe("privacy");
    expect(legalFromLabel("Terms")).toBe("terms");
    expect(legalFromLabel("Terms of Use")).toBe("terms");
    expect(legalFromLabel("Cookies")).toBe("cookies");
    expect(legalFromLabel("Books")).toBeUndefined();
  });
  it("prefers the author's own link, else the built-in page", () => {
    expect(footerLink("Privacy", "https://example.org/privacy")).toBe("https://example.org/privacy");
    expect(footerLink("Privacy", "  ")).toBe("page:privacy");
    expect(footerLink("Books")).toBeUndefined();
    expect(parseLegalHref("page:terms")).toBe("terms");
    expect(parseLegalHref("page:evil")).toBeUndefined();
    expect(parseLegalHref("https://x.com")).toBeUndefined();
  });
  it("hides links that lead nowhere", () => {
    const blocks = [{ id: "a", type: "faq" }] as Block[];
    expect(footerHasTarget("Privacy", undefined, blocks)).toBe(true);
    expect(footerHasTarget("FAQ", undefined, blocks)).toBe(true);
    expect(footerHasTarget("Signed copies", undefined, blocks)).toBe(false);
    expect(footerHasTarget("Anything", "javascript:alert(1)", blocks)).toBe(false);
    expect(footerHasTarget("Anything", "example.com", blocks)).toBe(true);
  });
  it("every template's legal footer links resolve", () => {
    for (const t of TEMPLATES) {
      const footer = buildDoc(t).blocks.find((b) => b.type === "footer")!;
      for (const it of footer.items ?? []) expect(footerHasTarget(it.title, it.meta, []), `${t.id} ${it.title}`).toBe(true);
    }
  });
  it("finds the site name and a real contact email", () => {
    const doc = buildDoc(TEMPLATES[0]);
    expect(siteIdentity(doc.blocks, "x").email).toBeUndefined(); // placeholder @example.com is ignored
    const blocks = [
      { id: "f", type: "footer", title: "Jane Doe" },
      { id: "c", type: "contact", items: [{ title: "Email", text: "jane@jane.com" }] },
    ] as Block[];
    expect(siteIdentity(blocks, "x")).toEqual({ name: "Jane Doe", email: "jane@jane.com" });
  });
});
