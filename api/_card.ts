// The preview card as a plain element tree (what satori draws). Kept apart from the handler so it can be tested.
import { clip, type SiteInfo } from "./_site.js";

const readable = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f.slice(0, 6), 16);
  if (Number.isNaN(n)) return "#ffffff";
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62 ? "#1a1a1a" : "#ffffff";
};

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
