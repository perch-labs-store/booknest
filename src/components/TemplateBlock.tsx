import { useState, type CSSProperties } from "react";
import { Check, ChevronDown, Menu, Minus, Plus, Star, X } from "lucide-react";
import EditableText from "./EditableText";
import EditableImage from "./EditableImage";
import SocialIcons from "./SocialIcons";
import { COVERS, imageKind, imageSrc, type Block, type Item, type Theme } from "../data/templates";

interface Props {
  block: Block;
  theme: Theme;
  editable: boolean;
  onChange: (patch: Partial<Block>) => void;
  /** Runs when a button or nav link is clicked (Preview and the published site). Gets the label and, for buttons, the author's link. */
  onNavigate?: (label: string, link?: string) => void;
  social?: Record<string, string>;
  onEditSocial?: (networkId: string) => void;
}

/** Readable text colour for a given background hex. */
export function readableOn(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "#ffffff";
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? "#1a1a1a" : "#ffffff";
}

const SHADOW = "shadow-[0_24px_50px_-12px_rgba(0,0,0,0.55)]";

/**
 * One section of a template website. Layout is driven by container queries (@xl, @3xl…)
 * so it responds to the width of the preview frame, not the browser window.
 */
export default function TemplateBlock(props: Props) {
  const { block, theme, editable, onChange, onNavigate, social, onEditSocial } = props;
  const heading = theme.font === "serif" ? "font-bold tracking-tight" : "font-extrabold tracking-tight";
  const items = block.items ?? [];
  const images = block.images ?? [];
  const r = theme.shape === "square" ? "rounded-md" : "rounded-full";
  const btnStyle = { backgroundColor: theme.accent, color: readableOn(theme.accent) };
  const line = { borderColor: `${theme.ink}1f` };
  const soft = { backgroundColor: `${theme.accent}1f` };
  const panel = { backgroundColor: `${theme.ink}0d`, borderColor: `${theme.ink}1a` };
  const go = (label: string | undefined, link?: string) => (onNavigate && label ? () => onNavigate(label, link) : undefined);

  const setItem = (i: number, patch: Partial<Item>) =>
    onChange({ items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const setImage = (i: number, id: string) => {
    const next = [...images];
    next[i] = id;
    onChange({ images: next });
  };

  const eyebrow = (align = "") => (
    <EditableText
      as="p"
      value={block.eyebrow ?? ""}
      editable={editable}
      onChange={(eyebrow) => onChange({ eyebrow })}
      placeholder="Small label"
      className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${align}`}
      style={{ color: theme.accent }}
    />
  );

  const sectionTitle = (
    <div className="mb-10 text-center">
      {eyebrow()}
      <EditableText
        as="h2"
        value={block.title ?? ""}
        editable={editable}
        onChange={(title) => onChange({ title })}
        className={`text-3xl @3xl:text-4xl ${heading}`}
      />
    </div>
  );

  const itemControls = (blank: () => Item) =>
    editable && (
      <div className="mt-8 flex justify-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => onChange({ items: [...items, blank()] })}
          style={line}
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1 opacity-70 hover:opacity-100"
        >
          <Plus size={12} /> Add item
        </button>
        {items.length > 1 && (
          <button
            type="button"
            onClick={() => onChange({ items: items.slice(0, -1) })}
            style={line}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 opacity-70 hover:opacity-100"
          >
            <Minus size={12} /> Remove last
          </button>
        )}
      </div>
    );

  const text = (value: string | undefined, set: (v: string) => void, className = "", as = "p", placeholder?: string, style?: CSSProperties) => (
    <EditableText as={as} value={value ?? ""} editable={editable} onChange={set} className={className} style={style} placeholder={placeholder} />
  );

  switch (block.type) {
    case "announce":
      return (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs font-medium" style={btnStyle}>
          {text(block.text, (t) => onChange({ text: t }), "", "span")}
          <EditableText
            value={block.button ?? ""}
            editable={editable}
            onChange={(button) => onChange({ button })}
            onActivate={go(block.button, block.link)}
            className="font-bold underline underline-offset-4"
          />
          {editable && <LinkField value={block.link} onChange={(link) => onChange({ link })} />}
        </div>
      );

    case "header":
      return <Header {...props} />;

    case "hero": {
      const centered = theme.hero === "center" || theme.hero === "banner";
      const first = images[0];
      const isPortrait = imageKind(first) === "author";
      const fan = centered && images.length >= 3 && !isPortrait;
      const banner = theme.hero === "banner" && first;

      const copy = (
        <div className={`relative flex flex-col ${centered ? "items-center text-center" : "items-start text-left"}`}>
          {eyebrow()}
          <EditableText
            as="h1"
            value={block.title ?? ""}
            editable={editable}
            onChange={(title) => onChange({ title })}
            className={`text-4xl leading-[1.08] @3xl:text-6xl ${heading}`}
          />
          <EditableText
            as="p"
            value={block.text ?? ""}
            editable={editable}
            onChange={(text) => onChange({ text })}
            className="mt-5 max-w-xl text-base leading-relaxed opacity-80 @3xl:text-lg"
          />
          <div className={`mt-8 flex flex-wrap gap-3 ${centered ? "justify-center" : ""}`}>
            <EditableText
              value={block.button ?? ""}
              editable={editable}
              onChange={(button) => onChange({ button })}
              onActivate={go(block.button, block.link)}
              className={`inline-block px-7 py-3 text-sm font-semibold ${r}`}
              style={btnStyle}
            />
            {editable && <LinkField value={block.link} onChange={(link) => onChange({ link })} />}
            {(block.button2 || editable) && (
              <>
                <EditableText
                  value={block.button2 ?? ""}
                  editable={editable}
                  onChange={(button2) => onChange({ button2 })}
                  onActivate={go(block.button2, block.link2)}
                  placeholder="Second button"
                  className={`inline-block border px-7 py-3 text-sm font-semibold ${r}`}
                  style={{ borderColor: `${theme.ink}40` }}
                />
                {editable && <LinkField value={block.link2} onChange={(link2) => onChange({ link2 })} />}
              </>
            )}
          </div>
        </div>
      );

      const shape = isPortrait ? "aspect-square rounded-3xl" : "aspect-[3/4] rounded-md";
      const art = first && (
        <div className="relative mx-auto w-full max-w-[260px] @3xl:max-w-[340px]">
          <div
            className="absolute -inset-6 -z-0 rounded-[2rem] opacity-80 blur-2xl"
            style={{ background: `radial-gradient(circle at 50% 40%, ${theme.accent}55, transparent 70%)` }}
          />
          <EditableImage
            value={first}
            onChange={(id) => setImage(0, id)}
            editable={editable}
            className={`relative ${shape} ${SHADOW} ${theme.hero === "left" ? "@3xl:rotate-[3deg]" : ""}`}
          />
        </div>
      );

      return (
        <section
          className="relative overflow-hidden px-6 py-14 @3xl:px-10 @3xl:py-24"
          style={{ background: banner ? undefined : `linear-gradient(160deg, ${theme.accent}1f 0%, transparent 55%)` }}
        >
          {banner && (
            <>
              <img src={imageSrc(first)} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${theme.bg}99 0%, ${theme.bg} 100%)` }} />
            </>
          )}
          <div className="relative mx-auto max-w-6xl">
            {centered ? (
              <>
                {copy}
                {fan ? (
                  <div className="mt-14 flex items-end justify-center">
                    {[1, 0, 2].map((slot, pos) => (
                      <EditableImage
                        key={slot}
                        value={images[slot]}
                        onChange={(id) => setImage(slot, id)}
                        editable={editable}
                        className={`aspect-[3/4] rounded-md ${SHADOW} ${
                          slot === 0
                            ? "relative z-10 w-32 @2xl:w-52"
                            : `w-24 @2xl:w-40 ${pos === 0 ? "-mr-4 -rotate-6 @2xl:-mr-8" : "-ml-4 rotate-6 @2xl:-ml-8"}`
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  first && <div className="mt-14">{art}</div>
                )}
              </>
            ) : (
              <div className={`grid items-center gap-12 @3xl:grid-cols-2 ${theme.hero === "split" ? "@3xl:[&>*:first-child]:order-2" : ""}`}>
                {copy}
                {art}
              </div>
            )}
          </div>
        </section>
      );
    }

    case "press":
      return (
        <section className="border-y px-6 py-8 @3xl:px-10" style={line}>
          <div className="mx-auto max-w-6xl text-center">
            {eyebrow()}
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-70">
              {items.map((it, i) => (
                <EditableText
                  key={i}
                  value={it.title}
                  editable={editable}
                  onChange={(title) => setItem(i, { title })}
                  className={`text-lg italic @3xl:text-xl ${theme.font === "serif" ? "" : "font-semibold"}`}
                />
              ))}
            </div>
            {itemControls(() => ({ title: "Publication", text: "" }))}
          </div>
        </section>
      );

    case "stats":
      return (
        <section className="px-6 py-14 @3xl:px-10" style={soft}>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center @3xl:grid-cols-4">
            {items.map((it, i) => (
              <div key={i}>
                <EditableText
                  as="p"
                  value={it.title}
                  editable={editable}
                  onChange={(title) => setItem(i, { title })}
                  className={`text-4xl @3xl:text-5xl ${heading}`}
                  style={{ color: theme.accent }}
                />
                <EditableText
                  as="p"
                  value={it.text}
                  editable={editable}
                  onChange={(text) => setItem(i, { text })}
                  className="mt-1 text-sm opacity-70"
                />
              </div>
            ))}
          </div>
          {itemControls(() => ({ title: "100+", text: "Something to brag about" }))}
        </section>
      );

    case "features":
      return (
        <section className="px-6 py-16 @3xl:px-10" style={soft}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <div className="grid gap-5 @2xl:grid-cols-2 @4xl:grid-cols-3">
              {items.map((it, i) => (
                <div key={i} style={panel} className="rounded-2xl border p-6">
                  <p className="mb-4 text-3xl font-bold opacity-90" style={{ color: theme.accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <EditableText as="h3" value={it.title} editable={editable} onChange={(title) => setItem(i, { title })} className="mb-2 text-lg font-semibold" />
                  <EditableText as="p" value={it.text} editable={editable} onChange={(text) => setItem(i, { text })} className="text-sm leading-relaxed opacity-70" />
                </div>
              ))}
            </div>
            {itemControls(() => ({ title: "New feature", text: "Write something here." }))}
          </div>
        </section>
      );

    case "cards":
      return (
        <section className="px-6 py-16 @3xl:px-10">
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <div className="grid gap-x-8 gap-y-12 @xl:grid-cols-2 @3xl:grid-cols-3">
              {items.map((it, i) => (
                <article key={i} className="group flex flex-col items-center text-center">
                  <EditableImage
                    value={it.image}
                    onChange={(image) => setItem(i, { image })}
                    editable={editable}
                    alt={it.title}
                    className={`aspect-[3/4] w-48 rounded-md ${SHADOW} transition duration-300 ${editable ? "" : "group-hover:-translate-y-2"} @3xl:w-56`}
                  />
                  <EditableText as="h3" value={it.title} editable={editable} onChange={(title) => setItem(i, { title })} className="mt-6 text-lg font-semibold" />
                  <EditableText as="p" value={it.text} editable={editable} onChange={(text) => setItem(i, { text })} className="mt-1.5 max-w-[16rem] text-sm leading-relaxed opacity-70" />
                </article>
              ))}
            </div>
            {itemControls(() => ({ title: "New book", text: "A short line about this book.", image: COVERS[items.length % COVERS.length].id }))}
          </div>
        </section>
      );

    case "authors":
      return (
        <section className="px-6 py-16 @3xl:px-10" style={soft}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <div className="grid grid-cols-2 gap-6 @3xl:grid-cols-4">
              {items.map((it, i) => (
                <article key={i} className="text-center">
                  <EditableImage
                    value={it.image}
                    onChange={(image) => setItem(i, { image })}
                    editable={editable}
                    alt={it.title}
                    className="mx-auto aspect-square w-full max-w-[220px] rounded-2xl shadow-lg"
                  />
                  <EditableText as="h3" value={it.title} editable={editable} onChange={(title) => setItem(i, { title })} className="mt-4 text-base font-semibold" />
                  <EditableText as="p" value={it.text} editable={editable} onChange={(text) => setItem(i, { text })} className="text-sm opacity-65" />
                </article>
              ))}
            </div>
            {itemControls(() => ({ title: "New author", text: "Genre author", image: "hana-sato" }))}
          </div>
        </section>
      );

    case "about":
      return (
        <section className="px-6 py-16 @3xl:px-10" style={soft}>
          <div className="mx-auto grid max-w-5xl items-center gap-10 @3xl:grid-cols-[minmax(0,320px)_1fr] @3xl:gap-16">
            <EditableImage
              value={images[0]}
              onChange={(id) => setImage(0, id)}
              editable={editable}
              alt="Portrait"
              className={`mx-auto aspect-square w-full max-w-[300px] rounded-3xl ${SHADOW}`}
            />
            <div className="text-center @3xl:text-left">
              {eyebrow()}
              {text(block.title, (title) => onChange({ title }), `mb-4 text-3xl @3xl:text-4xl ${heading}`, "h2")}
              {text(block.text, (t) => onChange({ text: t }), "leading-relaxed opacity-75")}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 @3xl:justify-start">
                {(block.button || editable) && (
                  <>
                    <EditableText
                      value={block.button ?? ""}
                      editable={editable}
                      onChange={(button) => onChange({ button })}
                      onActivate={go(block.button, block.link)}
                      placeholder="Button"
                      className={`inline-block border px-6 py-2.5 text-sm font-semibold ${r}`}
                      style={{ borderColor: theme.accent, color: theme.accent }}
                    />
                    {editable && <LinkField value={block.link} onChange={(link) => onChange({ link })} />}
                  </>
                )}
                <SocialIcons social={social} editable={editable} onEdit={onEditSocial} size={16} style={{ borderColor: `${theme.ink}30` }} />
              </div>
            </div>
          </div>
        </section>
      );

    case "quote":
      return (
        <section className="px-6 py-16 text-center @3xl:px-10 @3xl:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-6xl leading-none" style={{ color: theme.accent }} aria-hidden>
              “
            </p>
            {text(block.text, (t) => onChange({ text: t }), `text-2xl leading-snug @3xl:text-3xl ${theme.font === "serif" ? "italic" : "font-medium"}`)}
            <div className="mt-8 flex items-center justify-center gap-3 text-left">
              <EditableImage value={images[0]} onChange={(id) => setImage(0, id)} editable={editable} alt="" className="h-12 w-12 rounded-full" />
              <div>
                {text(block.title, (title) => onChange({ title }), "text-sm font-semibold")}
                {text(block.eyebrow, (eyebrow) => onChange({ eyebrow }), "text-xs opacity-60")}
              </div>
            </div>
          </div>
        </section>
      );

    case "testimonials":
      return (
        <section className="px-6 py-16 @3xl:px-10">
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <div className="grid gap-5 @2xl:grid-cols-2 @4xl:grid-cols-3">
              {items.map((it, i) => (
                <figure key={i} style={panel} className="flex flex-col rounded-2xl border p-6">
                  <div className="mb-3 flex gap-0.5" aria-label="5 out of 5 stars">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} size={16} fill={theme.accent} stroke={theme.accent} />
                    ))}
                  </div>
                  <EditableText as="blockquote" value={it.text} editable={editable} onChange={(t) => setItem(i, { text: t })} className="mb-5 flex-1 text-[15px] leading-relaxed opacity-85" />
                  <figcaption className="flex items-center gap-3">
                    <EditableImage value={it.image} onChange={(image) => setItem(i, { image })} editable={editable} alt="" className="h-10 w-10 shrink-0 rounded-full" />
                    <div>
                      <EditableText as="p" value={it.title} editable={editable} onChange={(title) => setItem(i, { title })} className="text-sm font-semibold" />
                      <EditableText as="p" value={it.meta ?? ""} editable={editable} onChange={(meta) => setItem(i, { meta })} className="text-xs opacity-60" />
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
            {itemControls(() => ({ title: "Reader name", text: "“A wonderful read from start to finish.”", image: "hana-sato", meta: "Reader" }))}
          </div>
        </section>
      );

    case "events":
      return (
        <section className="px-6 py-16 @3xl:px-10" style={soft}>
          <div className="mx-auto max-w-3xl">
            {sectionTitle}
            <ul className="flex flex-col gap-3">
              {items.map((it, i) => {
                const [day, ...mon] = (it.meta ?? "").split(" ");
                return (
                  <li key={i} style={panel} className="flex items-center gap-4 rounded-2xl border p-4 @xl:gap-6 @xl:p-5">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-center" style={btnStyle}>
                      <span className="text-xl font-bold leading-none">{day}</span>
                      <span className="mt-1 text-[10px] font-semibold tracking-widest">{mon.join(" ")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <EditableText as="h3" value={it.title} editable={editable} onChange={(title) => setItem(i, { title })} className="font-semibold" />
                      <EditableText as="p" value={it.text} editable={editable} onChange={(t) => setItem(i, { text: t })} className="text-sm opacity-65" />
                      {editable && (
                        <EditableText as="p" value={it.meta ?? ""} editable onChange={(meta) => setItem(i, { meta })} placeholder="12 DEC" className="mt-1 text-xs opacity-50" />
                      )}
                    </div>
                    <span className="hidden text-sm font-semibold @xl:inline" style={{ color: theme.accent }}>
                      Details →
                    </span>
                  </li>
                );
              })}
            </ul>
            {itemControls(() => ({ meta: "01 JAN", title: "New event", text: "Venue · 6:00 PM" }))}
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="px-6 py-16 @3xl:px-10">
          <div className="mx-auto max-w-3xl">
            {sectionTitle}
            <div className="flex flex-col gap-3">
              {items.map((it, i) =>
                editable ? (
                  <div key={i} style={panel} className="rounded-2xl border p-5">
                    <EditableText as="h3" value={it.title} editable onChange={(title) => setItem(i, { title })} className="font-semibold" />
                    <EditableText as="p" value={it.text} editable onChange={(t) => setItem(i, { text: t })} className="mt-2 text-sm leading-relaxed opacity-70" />
                  </div>
                ) : (
                  <details key={i} style={panel} className="group rounded-2xl border p-5 open:shadow-sm">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                      {it.title}
                      <ChevronDown size={18} className="shrink-0 transition group-open:rotate-180" style={{ color: theme.accent }} />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed opacity-70">{it.text}</p>
                  </details>
                ),
              )}
            </div>
            {itemControls(() => ({ title: "New question?", text: "Write the answer here." }))}
          </div>
        </section>
      );

    case "contact":
      return <Contact {...props} />;

    case "cta":
      return <Cta {...props} />;

    case "footer":
      return (
        <footer className="border-t px-6 pb-8 pt-14 @3xl:px-10" style={{ ...line, backgroundColor: `${theme.ink}08` }}>
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 @3xl:grid-cols-[1.4fr_repeat(3,1fr)]">
              <div>
                {text(block.title, (title) => onChange({ title }), "text-2xl font-bold", "div", undefined, { color: theme.accent })}
                {text(block.eyebrow, (eyebrow) => onChange({ eyebrow }), "mt-3 max-w-xs text-sm leading-relaxed opacity-70")}
                <SocialIcons social={social} editable={editable} onEdit={onEditSocial} className="mt-5" style={{ borderColor: `${theme.ink}30` }} />
              </div>
              {(block.columns ?? []).map((col, ci) => {
                const setCol = (patch: Partial<typeof col>) =>
                  onChange({ columns: (block.columns ?? []).map((c, idx) => (idx === ci ? { ...c, ...patch } : c)) });
                return (
                  <div key={ci}>
                    <EditableText as="p" value={col.title} editable={editable} onChange={(title) => setCol({ title })} className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] opacity-60" />
                    <ul className="flex flex-col gap-2.5 text-sm">
                      {col.links.map((l, li) => (
                        <li key={li}>
                          <EditableText
                            value={l}
                            editable={editable}
                            onChange={(v) => setCol({ links: col.links.map((x, idx) => (idx === li ? v : x)) })}
                            onActivate={go(l)}
                            className="opacity-80"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs @2xl:flex-row" style={line}>
              {text(block.text, (t) => onChange({ text: t }), "opacity-60")}
              <nav className="flex gap-5 opacity-70">
                {items.map((it, i) => (
                  <EditableText key={i} value={it.title} editable={editable} onChange={(title) => setItem(i, { title })} />
                ))}
              </nav>
            </div>
          </div>
        </footer>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Sections that hold their own state                                  */
/* ------------------------------------------------------------------ */

/** Edit mode only: the address a button opens on the published site. */
function LinkField({ value, onChange }: { value: string | undefined; onChange: (value: string) => void }) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] opacity-70 focus-within:opacity-100" style={{ borderColor: "currentColor" }}>
      <span className="font-semibold">Link</span>
      <input
        type="text"
        inputMode="url"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://… or mailto:…"
        aria-label="Button link"
        className="w-36 min-w-0 bg-transparent font-normal text-inherit outline-none placeholder:opacity-50"
      />
    </label>
  );
}

function Header({ block, theme, editable, onChange, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const items = block.items ?? [];
  const r = theme.shape === "square" ? "rounded-md" : "rounded-full";
  const go = (label: string | undefined, link?: string) =>
    onNavigate && label
      ? () => {
          setOpen(false);
          onNavigate(label, link);
        }
      : undefined;

  return (
    <header className="sticky top-0 z-10 border-b backdrop-blur" style={{ borderColor: `${theme.ink}1f`, backgroundColor: `${theme.bg}e6` }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4 @3xl:px-10">
        <EditableText
          as="div"
          value={block.title ?? ""}
          editable={editable}
          onChange={(title) => onChange({ title })}
          onActivate={() => onNavigate?.("__top")}
          className="text-xl font-bold"
          style={{ color: theme.accent }}
        />
        <nav
          className={`order-3 w-full flex-col gap-3 pb-2 text-sm opacity-90 @2xl:order-none @2xl:flex @2xl:w-auto @2xl:flex-row @2xl:gap-6 @2xl:pb-0 ${
            editable || open ? "flex flex-wrap" : "hidden"
          }`}
        >
          {items.map((it, i) => (
            <EditableText
              key={i}
              value={it.title}
              editable={editable}
              onChange={(title) => onChange({ items: items.map((x, idx) => (idx === i ? { ...x, title } : x)) })}
              onActivate={go(it.title)}
            />
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <EditableText
            value={block.button ?? ""}
            editable={editable}
            onChange={(button) => onChange({ button })}
            onActivate={go(block.button, block.link)}
            className={`border px-4 py-2 text-xs font-semibold ${r}`}
            style={{ borderColor: theme.accent, color: theme.accent }}
          />
          {editable && <LinkField value={block.link} onChange={(link) => onChange({ link })} />}
          {!editable && (
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="rounded-md p-1.5 @2xl:hidden"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const field = (theme: Theme): CSSProperties => ({
  backgroundColor: `${theme.ink}0d`,
  borderColor: `${theme.ink}30`,
  color: theme.ink,
});

function Cta({ block, theme, editable, onChange }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const on = readableOn(theme.accent);
  const r = theme.shape === "square" ? "rounded-md" : "rounded-full";
  const heading = theme.font === "serif" ? "font-bold tracking-tight" : "font-extrabold tracking-tight";

  return (
    <section className="px-6 py-10 @3xl:px-10 @3xl:py-16">
      <div className="mx-auto max-w-5xl rounded-3xl px-6 py-14 text-center @3xl:px-16" style={{ backgroundColor: theme.accent, color: on }}>
        <EditableText as="h2" value={block.title ?? ""} editable={editable} onChange={(title) => onChange({ title })} className={`mb-3 text-3xl @3xl:text-4xl ${heading}`} />
        <EditableText as="p" value={block.text ?? ""} editable={editable} onChange={(text) => onChange({ text })} className="mx-auto mb-8 max-w-xl opacity-85" />
        {sent && !editable ? (
          <p className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: on, color: theme.accent }}>
            <Check size={16} /> Thanks! You're on the list.
          </p>
        ) : (
          <form
            className="mx-auto flex max-w-md flex-col gap-3 @xl:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editable) setSent(true);
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={editable}
              tabIndex={editable ? -1 : 0}
              placeholder="Your email address"
              aria-label="Email address"
              className={`min-w-0 flex-1 border-0 px-5 py-3 text-sm outline-none placeholder:opacity-60 ${r}`}
              style={{ backgroundColor: `${on}22`, color: on }}
            />
            {editable ? (
              <EditableText
                value={block.button ?? ""}
                editable
                onChange={(button) => onChange({ button })}
                className={`inline-block px-7 py-3 text-sm font-semibold ${r}`}
                style={{ backgroundColor: on, color: theme.accent }}
              />
            ) : (
              <button type="submit" className={`px-7 py-3 text-sm font-semibold ${r}`} style={{ backgroundColor: on, color: theme.accent }}>
                {block.button}
              </button>
            )}
          </form>
        )}
      </div>
    </section>
  );
}

function Contact({ block, theme, editable, onChange, social, onEditSocial }: Props) {
  const [sent, setSent] = useState(false);
  const items = block.items ?? [];
  const r = theme.shape === "square" ? "rounded-md" : "rounded-full";
  const heading = theme.font === "serif" ? "font-bold tracking-tight" : "font-extrabold tracking-tight";
  const inputCls = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2";
  const lock = editable ? { readOnly: true, tabIndex: -1 } : {};

  return (
    <section className="px-6 py-16 @3xl:px-10">
      <div className="mx-auto grid max-w-5xl gap-10 @3xl:grid-cols-2 @3xl:gap-16">
        <div>
          <EditableText as="p" value={block.eyebrow ?? ""} editable={editable} onChange={(eyebrow) => onChange({ eyebrow })} className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.accent }} />
          <EditableText as="h2" value={block.title ?? ""} editable={editable} onChange={(title) => onChange({ title })} className={`mb-4 text-3xl @3xl:text-4xl ${heading}`} />
          <EditableText as="p" value={block.text ?? ""} editable={editable} onChange={(text) => onChange({ text })} className="mb-8 leading-relaxed opacity-75" />
          <dl className="mb-6 flex flex-col gap-4">
            {items.map((it, i) => (
              <div key={i}>
                <EditableText as="dt" value={it.title} editable={editable} onChange={(title) => onChange({ items: items.map((x, idx) => (idx === i ? { ...x, title } : x)) })} className="text-xs font-semibold uppercase tracking-widest opacity-55" />
                <EditableText as="dd" value={it.text} editable={editable} onChange={(text) => onChange({ items: items.map((x, idx) => (idx === i ? { ...x, text } : x)) })} className="font-medium" />
              </div>
            ))}
          </dl>
          <SocialIcons social={social} editable={editable} onEdit={onEditSocial} style={{ borderColor: `${theme.ink}30` }} />
        </div>

        <div className="rounded-3xl border p-6 @3xl:p-8" style={{ backgroundColor: `${theme.ink}0d`, borderColor: `${theme.ink}1a` }}>
          {sent && !editable ? (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: theme.accent, color: readableOn(theme.accent) }}>
                <Check size={24} />
              </span>
              <p className="text-lg font-semibold">Message sent</p>
              <p className="text-sm opacity-70">Thank you for getting in touch. We'll reply soon.</p>
              <button type="button" onClick={() => setSent(false)} className="mt-2 text-sm underline underline-offset-4" style={{ color: theme.accent }}>
                Send another
              </button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!editable) setSent(true);
              }}
            >
              <input required name="name" placeholder="Your name" aria-label="Your name" className={inputCls} style={field(theme)} {...lock} />
              <input required type="email" name="email" placeholder="Email address" aria-label="Email address" className={inputCls} style={field(theme)} {...lock} />
              <textarea required name="message" rows={4} placeholder="How can we help?" aria-label="Message" className={`${inputCls} resize-none`} style={field(theme)} {...lock} />
              {editable ? (
                <EditableText
                  value={block.button ?? ""}
                  editable
                  onChange={(button) => onChange({ button })}
                  className={`self-start px-7 py-3 text-sm font-semibold ${r}`}
                  style={{ backgroundColor: theme.accent, color: readableOn(theme.accent) }}
                />
              ) : (
                <button type="submit" className={`self-start px-7 py-3 text-sm font-semibold ${r}`} style={{ backgroundColor: theme.accent, color: readableOn(theme.accent) }}>
                  {block.button}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
