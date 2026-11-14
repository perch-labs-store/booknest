import { useEffect, useRef, useState } from "react";
import TemplateBlock from "./TemplateBlock";
import type { SiteDoc } from "../data/templates";

const WIDTH = 1100;

export function siteFont(font: "serif" | "sans") {
  return font === "serif" ? '"Playfair Display", Georgia, serif' : "Inter, system-ui, sans-serif";
}

/** A miniature, non-interactive render of the real website, scaled to fit its box. */
export default function SitePreview({ doc, className = "" }: { doc: SiteDoc; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { theme } = doc;
  return (
    <div ref={box} className={`relative overflow-hidden ${className}`} style={{ backgroundColor: theme.bg }} aria-hidden>
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left select-none @container"
        style={{ width: WIDTH, transform: `scale(${scale})`, backgroundColor: theme.bg, color: theme.ink, fontFamily: siteFont(theme.font) }}
      >
        {doc.blocks.slice(0, 4).map((b) => (
          <TemplateBlock key={b.id} block={b} theme={theme} editable={false} onChange={() => {}} />
        ))}
      </div>
    </div>
  );
}
