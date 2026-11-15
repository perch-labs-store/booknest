import { Component, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import TemplateBlock from "../components/TemplateBlock";
import { siteFont } from "../components/SitePreview";
import { loadPublishedSite } from "../data/remote";
import { buildDoc, resolveTarget, TEMPLATES, type Block, type SiteDoc } from "../data/templates";
import { ROOT_DOMAIN } from "../lib/host";
import { openLink, sanitizeLink } from "../lib/safeLink";

/** The main Fablebook site: https://<ROOT_DOMAIN>, or "/" when no root domain is configured. */
const MAIN_SITE = ROOT_DOMAIN ? `https://${ROOT_DOMAIN}` : "/";

type State =
  | { kind: "loading" }
  | { kind: "ready"; doc: SiteDoc; title?: string; authorName?: string }
  | { kind: "missing" }
  | { kind: "error" };

/** Anyone can write to the database, so check the saved copy has the shape the page needs before drawing it. */
function toSiteDoc(raw: unknown): SiteDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<SiteDoc>;
  const t = d.theme as Partial<SiteDoc["theme"]> | undefined;
  if (!Array.isArray(d.blocks) || !t || typeof t !== "object") return null;
  if (typeof t.accent !== "string" || typeof t.bg !== "string" || typeof t.ink !== "string") return null;
  const blocks = d.blocks.filter((b): b is Block => !!b && typeof b === "object" && typeof (b as Block).id === "string" && typeof (b as Block).type === "string");
  const social = d.social && typeof d.social === "object" ? d.social : undefined;
  return { ...d, theme: { ...(t as SiteDoc["theme"]), font: t.font === "serif" ? "serif" : "sans" }, blocks, social };
}

const clip = (text: string, max = 155) => {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length).replace(/[\s,.;:–—-]+$/, "")}…`;
};

/** Meta description: the first headline / text from the page itself (skipping the header, announcement bar and footer). */
function describe(blocks: Block[]): string {
  for (const b of blocks) {
    if (b.type === "header" || b.type === "announce" || b.type === "footer") continue;
    const parts = [b.title, b.text].map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
    if (parts.length) return clip(parts.join(" — "));
  }
  return "";
}

function setMeta(selector: string, create: () => HTMLMetaElement, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
const named = (name: string, content: string) =>
  setMeta(`meta[name="${name}"]`, () => Object.assign(document.createElement("meta"), { name }), content);
const og = (property: string, content: string) =>
  setMeta(`meta[property="${property}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute("property", property);
    return m;
  }, content);

/** If one block has unexpected data, show a plain message instead of a blank page. */
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Message title="This site couldn't be displayed" text="Something in the page is not readable. Please try again later." /> : this.props.children;
  }
}

function Message({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-ink">
      <h1 className="font-serif text-2xl font-bold">{title}</h1>
      <p className="max-w-sm text-sm text-muted">{text}</p>
      {children}
    </main>
  );
}

function Skeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading site" className="min-h-screen animate-pulse bg-bg px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="h-8 w-40 rounded-md bg-line" />
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="h-10 w-3/4 max-w-md rounded-md bg-line" />
          <div className="h-4 w-2/3 max-w-sm rounded-md bg-line" />
          <div className="h-11 w-36 rounded-full bg-line" />
          <div className="mt-8 h-56 w-40 rounded-md bg-line" />
        </div>
      </div>
    </div>
  );
}

/** A published author website: just the author's page, none of the Fablebook app. */
export default function PublishedSite({ subdomain }: { subdomain: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    loadPublishedSite(subdomain)
      .then((site) => {
        if (cancelled) return;
        // Development only: /?site=demo shows a built-in sample site when the database has none. Removed from production builds.
        if (!site && import.meta.env.DEV && subdomain === "demo" && TEMPLATES[0]) {
          setState({ kind: "ready", doc: buildDoc(TEMPLATES[0]), title: "Demo site", authorName: "Demo Author" });
          return;
        }
        const doc = site ? toSiteDoc(site.doc) : null;
        setState(site && doc ? { kind: "ready", doc, title: site.title, authorName: site.authorName } : { kind: "missing" });
      })
      .catch((e) => {
        console.error("[Fablebook] Could not load this site:", e);
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [subdomain, attempt]);

  const ready = state.kind === "ready" ? state : null;

  // Tab title, description, social-share tags and colours that match the author's design.
  useEffect(() => {
    if (!ready) {
      document.title = state.kind === "missing" ? "Site not published" : "Fablebook";
      return;
    }
    const title = ready.title?.trim() || ready.authorName?.trim() || subdomain;
    const description = describe(ready.doc.blocks);
    document.title = title;
    if (description) {
      named("description", description);
      og("og:description", description);
    }
    og("og:title", title);
    og("og:type", "website");
    og("og:url", window.location.href);
    named("theme-color", ready.doc.theme.bg);
    document.documentElement.style.backgroundColor = ready.doc.theme.bg;
    document.body.style.backgroundColor = ready.doc.theme.bg;
  }, [ready, state.kind, subdomain]);

  const blocks = ready?.doc.blocks;
  /** Clicks on buttons and nav links: open the author's link, or scroll to the section the label names. */
  const navigate = useCallback(
    (label: string, link?: string) => {
      if (link && link.trim()) {
        const href = sanitizeLink(link);
        if (href) openLink(href);
        return;
      }
      const href = sanitizeLink(label);
      if (href && /^(https?:|mailto:|tel:)/i.test(label.trim())) return openLink(href);
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (label === "__top") return window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
      const id = blocks ? resolveTarget(label, blocks) : undefined;
      document.getElementById(id ? `blk-${id}` : "")?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    },
    [blocks],
  );

  const theme = ready?.doc.theme;
  const wrapStyle = useMemo(
    () => (theme ? { backgroundColor: theme.bg, color: theme.ink, fontFamily: siteFont(theme.font) } : undefined),
    [theme],
  );

  if (state.kind === "loading") return <Skeleton />;
  if (state.kind === "missing")
    return (
      <Message title="This site isn't published yet" text="The address is right, but its author hasn't published a website here.">
        <a href={MAIN_SITE} className="mt-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:opacity-90">
          Go to Fablebook
        </a>
      </Message>
    );
  if (state.kind === "error")
    return (
      <Message title="Couldn't load this site" text="Check your connection and try again.">
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:opacity-90">
          Retry
        </button>
      </Message>
    );

  const { doc } = state;
  return (
    <Boundary>
      <div className="@container min-h-screen overflow-x-clip" style={wrapStyle}>
        {doc.blocks.map((b) => (
          <div key={b.id} id={`blk-${b.id}`} className="scroll-mt-20">
            <TemplateBlock block={b} theme={doc.theme} editable={false} onChange={() => {}} onNavigate={navigate} social={doc.social} />
          </div>
        ))}
        <p className="px-6 py-5 text-center text-xs opacity-60">
          <a href={MAIN_SITE} className="underline-offset-4 hover:underline">
            Made with Fablebook
          </a>
        </p>
      </div>
    </Boundary>
  );
}
