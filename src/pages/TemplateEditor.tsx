import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, Eye, Monitor, Pencil, RotateCcw, SlidersHorizontal, Smartphone, Tablet, Trash2, X } from "lucide-react";
import TemplateBlock from "../components/TemplateBlock";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { deleteSiteDoc, loadSiteDoc, saveSiteDoc } from "../data/remote";
import { NETWORKS } from "../components/SocialIcons";
import { siteFont } from "../components/SitePreview";
import {
  BLOCK_LABELS,
  buildDoc,
  ctxFor,
  findTemplate,
  newBlock,
  resolveTarget,
  type Block,
  type BlockType,
  type HeroLayout,
  type SiteDoc,
  type Theme,
} from "../data/templates";

const storageKey = (id: string) => `booknest.template.v3.${id}`;

function load(id: string): SiteDoc | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return null;
    const doc = JSON.parse(raw) as SiteDoc;
    return Array.isArray(doc.blocks) && doc.theme ? doc : null;
  } catch {
    return null;
  }
}

const ADDABLE: BlockType[] = ["announce", "press", "stats", "features", "cards", "authors", "about", "quote", "testimonials", "events", "faq", "contact", "cta"];
const DEVICES = [
  { value: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { value: "tablet", label: "Tablet", icon: Tablet, width: "768px" },
  { value: "mobile", label: "Mobile", icon: Smartphone, width: "390px" },
] as const;
const HERO_OPTIONS: { value: HeroLayout; label: string }[] = [
  { value: "center", label: "Centered" },
  { value: "left", label: "Left" },
  { value: "split", label: "Split" },
  { value: "banner", label: "Banner" },
];

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-line p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            o.value === value ? "bg-brand/25 text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const template = findTemplate(id);
  const [doc, setDoc] = useState<SiteDoc | null>(() => (template ? load(template.id) ?? buildDoc(template) : null));
  const [editing, setEditing] = useState(true);
  const [saved, setSaved] = useState(true);
  const [device, setDevice] = useState<(typeof DEVICES)[number]["value"]>("desktop");
  const [panelOpen, setPanelOpen] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { signedIn, loading: authLoading } = useAuth();
  // Signed-in authors keep their site in Supabase. Saving waits until the saved copy has been checked.
  const [remoteReady, setRemoteReady] = useState(false);

  useEffect(() => {
    if (!template || authLoading) return;
    if (!signedIn) return setRemoteReady(false);
    let cancelled = false;
    loadSiteDoc<SiteDoc>(template.id).then((remote) => {
      if (cancelled) return;
      if (remote?.blocks) setDoc(remote);
      setRemoteReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [template, signedIn, authLoading]);

  // Autosave every change in this browser.
  useEffect(() => {
    if (!template || !doc) return;
    setSaved(false);
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey(template.id), JSON.stringify(doc));
      } catch {
        /* storage unavailable: edits stay in memory only */
      }
      if (signedIn && remoteReady) {
        saveSiteDoc(template.id, doc)
          .then(() => setSaved(true))
          .catch((e) => console.error("[BookNest] Could not save your site:", e));
      } else {
        setSaved(true);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [doc, template, signedIn, remoteReady]);

  // Esc leaves the editor (first press just stops typing / closes a dialog).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("[data-modal]")) return;
      const active = document.activeElement as HTMLElement | null;
      if (active?.isContentEditable) {
        active.blur();
        return;
      }
      navigate("/templates");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  if (!template || !doc) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">That template doesn't exist.</p>
        <Link to="/templates" className="mt-3 inline-block text-accent underline">
          Back to templates
        </Link>
      </div>
    );
  }

  const setTheme = (patch: Partial<Theme>) => setDoc({ ...doc, theme: { ...doc.theme, ...patch } });
  const setBlock = (blockId: string, patch: Partial<Block>) =>
    setDoc({ ...doc, blocks: doc.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= doc.blocks.length) return;
    const blocks = [...doc.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    setDoc({ ...doc, blocks });
  };
  const remove = (i: number) => setDoc({ ...doc, blocks: doc.blocks.filter((_, idx) => idx !== i) });
  const add = (type: BlockType) => {
    const blocks = [...doc.blocks];
    // The announcement bar goes first; other sections go before the footer when there is one.
    const at = type === "announce" ? 0 : blocks[blocks.length - 1]?.type === "footer" ? blocks.length - 1 : blocks.length;
    blocks.splice(at, 0, newBlock(type, ctxFor(template)));
    setDoc({ ...doc, blocks });
  };
  const reset = () => {
    setConfirmReset(false);
    try {
      localStorage.removeItem(storageKey(template.id));
    } catch {
      /* ignore */
    }
    if (signedIn) deleteSiteDoc(template.id).catch(() => undefined);
    setDoc(buildDoc(template));
  };

  const setSocial = (network: string, url: string) => setDoc({ ...doc, social: { ...(doc.social ?? {}), [network]: url } });
  const editSocial = (network: string) => {
    setPanelOpen(true);
    setTimeout(() => document.getElementById(`social-${network}`)?.focus(), 50);
  };

  const goto = (label: string) => {
    const target = label === "__top" ? doc.blocks[0]?.id : resolveTarget(label, doc.blocks);
    const el = target ? document.getElementById(`blk-${target}`) : null;
    if (label === "__top") canvasRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    else el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { theme } = doc;
  const width = DEVICES.find((d) => d.value === device)!.width;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-bg text-ink">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => navigate("/templates")}
          aria-label="Close editor"
          title="Close (Esc)"
          className="rounded-lg border border-line p-2 text-muted hover:bg-brand/10 hover:text-ink"
        >
          <X size={18} />
        </button>
        <div className="mr-auto min-w-0">
          <h1 className="truncate font-serif text-lg font-bold leading-tight">
            {template.name} <span className="text-sm font-normal text-muted">· {template.category}</span>
          </h1>
          <p className="flex items-center gap-1 text-xs text-muted">
            {saved ? (
              <>
                <Check size={12} className="text-success" /> Saved
              </>
            ) : (
              "Saving…"
            )}
          </p>
        </div>

        <div className="hidden items-center gap-1 rounded-lg border border-line p-1 md:flex">
          {DEVICES.map((d) => (
            <button
              key={d.value}
              type="button"
              aria-label={d.label}
              title={d.label}
              onClick={() => setDevice(d.value)}
              className={`rounded-md p-1.5 ${device === d.value ? "bg-brand/25 text-ink" : "text-muted hover:text-ink"}`}
            >
              <d.icon size={16} />
            </button>
          ))}
        </div>

        <Segmented
          options={[
            { value: "edit", label: "Edit" },
            { value: "preview", label: "Preview" },
          ]}
          value={editing ? "edit" : "preview"}
          onChange={(v) => setEditing(v === "edit")}
        />
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-label="Toggle design panel"
          aria-pressed={panelOpen}
          className={`rounded-lg border border-line p-2 ${panelOpen ? "bg-brand/25 text-ink" : "text-muted hover:text-ink"}`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* Canvas: the website itself */}
        <div ref={canvasRef} className="min-w-0 flex-1 overflow-y-auto bg-black/[0.07] p-0 dark:bg-black/40 md:p-5">
          <div
            className="@container mx-auto min-h-full overflow-hidden shadow-xl transition-[max-width] duration-300 md:rounded-xl md:border md:border-line"
            style={{ maxWidth: width, backgroundColor: theme.bg, color: theme.ink, fontFamily: siteFont(theme.font) }}
          >
            {editing && (
              <p className="flex items-center justify-center gap-1.5 bg-sky-500 px-3 py-1.5 text-xs font-medium text-white">
                <Pencil size={12} /> Click any text to edit it · click an image to change it · switch to Preview to try the links
              </p>
            )}
            {!editing && (
              <p className="flex items-center justify-center gap-1.5 bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
                <Eye size={12} /> Preview
              </p>
            )}
            {doc.blocks.length === 0 && (
              <p className="px-6 py-20 text-center opacity-60">This page is empty. Add a section from the panel.</p>
            )}
            {doc.blocks.map((b) => (
              <div key={b.id} id={`blk-${b.id}`} className="scroll-mt-24">
                <TemplateBlock block={b} theme={theme} editable={editing} onChange={(p) => setBlock(b.id, p)} onNavigate={goto} social={doc.social} onEditSocial={editSocial} />
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        {panelOpen && (
          <aside className="absolute inset-y-0 right-0 z-10 flex w-full max-w-xs flex-col gap-5 overflow-y-auto border-l border-line bg-surface p-4 shadow-2xl md:static md:w-80 md:max-w-none md:shadow-none">
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Design</h2>
              <div className="mb-3 grid grid-cols-3 gap-2 text-xs text-muted">
                {(
                  [
                    ["Accent", "accent"],
                    ["Background", "bg"],
                    ["Text", "ink"],
                  ] as const
                ).map(([label, key]) => (
                  <label key={key} className="flex flex-col gap-1">
                    {label}
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(e) => setTheme({ [key]: e.target.value })}
                      className="h-9 w-full cursor-pointer rounded-md border border-line bg-transparent p-0.5"
                    />
                  </label>
                ))}
              </div>
              <p className="mb-1 text-xs text-muted">Font</p>
              <div className="mb-3">
                <Segmented
                  options={[
                    { value: "serif", label: "Serif" },
                    { value: "sans", label: "Sans" },
                  ]}
                  value={theme.font}
                  onChange={(font) => setTheme({ font })}
                />
              </div>
              <p className="mb-1 text-xs text-muted">Hero layout</p>
              <div className="mb-3">
                <Segmented options={HERO_OPTIONS} value={theme.hero} onChange={(hero) => setTheme({ hero })} />
              </div>
              <p className="mb-1 text-xs text-muted">Buttons</p>
              <Segmented
                options={[
                  { value: "pill", label: "Rounded" },
                  { value: "square", label: "Square" },
                ]}
                value={theme.shape ?? "pill"}
                onChange={(shape) => setTheme({ shape })}
              />
            </section>

            <section>
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Social links</h2>
              <p className="mb-3 text-xs text-muted">Paste a link to show its icon on your site. Leave blank to hide it.</p>
              <ul className="flex flex-col gap-2">
                {NETWORKS.map((n) => (
                  <li key={n.id} className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-muted">{n.icon(15)}</span>
                    <input
                      id={`social-${n.id}`}
                      type="url"
                      value={doc.social?.[n.id] ?? ""}
                      onChange={(e) => setSocial(n.id, e.target.value)}
                      placeholder={n.placeholder}
                      aria-label={`${n.label} link`}
                      className="min-w-0 flex-1 rounded-lg border border-line bg-transparent px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-muted/60 focus:border-brand"
                    />
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Sections</h2>
              <ul className="flex flex-col gap-1.5">
                {doc.blocks.map((b, i) => (
                  <li key={b.id} className="flex items-center gap-1 rounded-lg border border-line px-2 py-1.5">
                    <span className="mr-auto truncate text-sm">{BLOCK_LABELS[b.type]}</span>
                    <button
                      type="button"
                      aria-label={`Move ${BLOCK_LABELS[b.type]} up`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="rounded p-1 text-muted hover:text-ink disabled:opacity-30"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${BLOCK_LABELS[b.type]} down`}
                      disabled={i === doc.blocks.length - 1}
                      onClick={() => move(i, 1)}
                      className="rounded p-1 text-muted hover:text-ink disabled:opacity-30"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${BLOCK_LABELS[b.type]}`}
                      onClick={() => remove(i)}
                      className="rounded p-1 text-muted hover:text-error"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mb-1.5 mt-3 text-xs text-muted">Add a section</p>
              <div className="flex flex-wrap gap-1.5">
                {ADDABLE.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => add(type)}
                    className="rounded-full border border-line px-3 py-1 text-xs hover:bg-brand/10"
                  >
                    + {BLOCK_LABELS[type]}
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-muted hover:text-error"
            >
              <RotateCcw size={14} /> Reset template
            </button>
          </aside>
        )}
      </div>

      {confirmReset && (
        <ConfirmModal
          danger
          title="Reset this template?"
          message="This restores the original text, images and design. Your edits will be lost."
          confirmLabel="Reset"
          onConfirm={reset}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
