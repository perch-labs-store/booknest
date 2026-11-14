import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronDown, ImagePlus, Plus, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { GENRE_FILTERS } from "../data/catalog";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { loadBookForEdit, loadRemote, saveBook, updateBook } from "../data/remote";
import { FORMAT_LABELS, LINK_FORMATS, STORE_LABELS, normalizeUrl, type LinkFormat, type LinkStore } from "../data/links";

const GENRES = [...GENRE_FILTERS, "Business", "Horror", "Historical"] as const;
const LANGUAGES = ["English", "Swahili", "French", "Spanish", "German", "Arabic"] as const;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

interface Form {
  title: string;
  subtitle: string;
  genre: string;
  language: string;
  description: string;
  date: string;
  isbn: string;
  publisher: string;
  discount: string;
  discountEnds: string;
  discountCode: string;
}
const EMPTY: Form = { title: "", subtitle: "", genre: "", language: "English", description: "", date: "", isbn: "", publisher: "", discount: "", discountEnds: "", discountCode: "" };
type Errors = Partial<Record<keyof Form | "cover" | "links", string>>;

/** One place where the book can be bought: which version, which store, and the link. */
interface LinkRow { format: LinkFormat; store: LinkStore; url: string }
const NEW_ROW: LinkRow = { format: "printed", store: "amazon", url: "" };
const MAX_LINKS = 6;
const today = () => new Date().toISOString().slice(0, 10);

const inputCls =
  "h-11 w-full rounded-lg border bg-bg px-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none";

function Field({ label, required, optional, error, children, htmlFor }: { label: string; required?: boolean; optional?: boolean; error?: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-ink">
        {label}
        {required && <span className="text-error"> *</span>}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-err`} role="alert" className="mt-1 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AddBook() {
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [links, setLinks] = useState<LinkRow[]>([{ ...NEW_ROW }]);
  const [linkErrors, setLinkErrors] = useState<Record<number, string>>({});
  const [cover, setCover] = useState<{ file: File; url: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [done, setDone] = useState<null | "draft" | "published">(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { signedIn } = useAuth();
  const authModal = useAuthModal();
  const [params] = useSearchParams();
  const editId = Number(params.get("edit")) || null;
  const [existingCover, setExistingCover] = useState<string | null>(null);
  const [loadingBook, setLoadingBook] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editing: fill the form with the saved book once we know who is signed in.
  const { loading: authLoading } = useAuth();
  useEffect(() => {
    if (!editId || authLoading) return;
    if (!signedIn) return setLoadingBook(false);
    let cancelled = false;
    loadBookForEdit(editId).then((b) => {
      if (cancelled) return;
      if (b) {
        setForm({
          title: b.title, subtitle: b.subtitle, genre: b.genre, language: b.language, description: b.description,
          date: b.releaseDate, isbn: b.isbn, publisher: b.publisher, discount: b.discountPercent,
          discountEnds: b.discountEnds, discountCode: b.discountCode,
        });
        setLinks(b.links.length ? b.links : [{ ...NEW_ROW }]);
        setExistingCover(b.coverUrl);
      } else {
        setSaveError("We couldn't find that book, or it isn't yours to edit.");
      }
      setLoadingBook(false);
    });
    return () => {
      cancelled = true;
    };
  }, [editId, signedIn, authLoading]);

  // Release the object URL when the cover changes or the page unmounts.
  useEffect(() => () => { if (cover) URL.revokeObjectURL(cover.url); }, [cover]);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const pickFile = (file?: File) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return setErrors((e) => ({ ...e, cover: "Use a PNG, JPG or WEBP image." }));
    if (file.size > MAX_BYTES) return setErrors((e) => ({ ...e, cover: "Image must be 5MB or smaller." }));
    setErrors((e) => ({ ...e, cover: undefined }));
    setCover({ file, url: URL.createObjectURL(file) });
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const setRow = (i: number, patch: Partial<LinkRow>) => {
    setLinks((rows) => rows.map((r, n) => (n === i ? { ...r, ...patch } : r)));
    setLinkErrors((er) => ({ ...er, [i]: "" }));
    setErrors((er) => ({ ...er, links: undefined }));
  };
  const addRow = () => setLinks((rows) => (rows.length < MAX_LINKS ? [...rows, { ...NEW_ROW }] : rows));
  const removeRow = (i: number) => {
    setLinks((rows) => (rows.length > 1 ? rows.filter((_, n) => n !== i) : [{ ...NEW_ROW }]));
    setLinkErrors({});
  };

  const validate = (mode: "draft" | "published") => {
    const er: Errors = {};
    const rowErr: Record<number, string> = {};
    if (!form.title.trim()) er.title = "Enter the book title.";
    const isbn = form.isbn.replace(/[-\s]/g, "");
    if (isbn && !/^(\d{9}[\dXx]|\d{13})$/.test(isbn)) er.isbn = "ISBN must be 10 or 13 digits.";

    links.forEach((r, i) => {
      if (r.url.trim() && !normalizeUrl(r.url)) rowErr[i] = "Enter a valid link, e.g. https://www.amazon.com/…";
    });

    const pct = form.discount.trim();
    if (pct) {
      const n = Number(pct);
      if (!Number.isInteger(n) || n < 1 || n > 99) er.discount = "Enter a whole number from 1 to 99.";
    } else if (form.discountEnds || form.discountCode.trim()) {
      er.discount = "Enter the discount percentage.";
    }
    if (form.discountEnds && form.discountEnds < today()) er.discountEnds = "The end date can't be in the past.";
    if (form.discountCode.trim() && !/^[A-Za-z0-9_-]{2,20}$/.test(form.discountCode.trim())) er.discountCode = "2–20 letters, numbers, - or _.";

    if (mode === "published") {
      if (!links.some((r, i) => r.url.trim() && !rowErr[i])) er.links = "Add at least one link where people can buy your book.";
      if (!form.genre) er.genre = "Select a genre.";
      if (!form.description.trim()) er.description = "Write a short description.";
      else if (form.description.trim().length < 20) er.description = "Description needs at least 20 characters.";
    }
    return { er, rowErr };
  };

  const submit = async (mode: "draft" | "published") => {
    if (saving) return;
    setSaveError(null);
    const { er, rowErr } = validate(mode);
    setErrors((prev) => ({ cover: prev.cover, ...er }));
    setLinkErrors(rowErr);
    const firstRow = Object.keys(rowErr)[0];
    const first = (["title", "genre", "description", "isbn", "discount", "discountEnds", "discountCode"] as const).find((k) => er[k]);
    if (first || firstRow !== undefined || er.links) {
      const target = first ? id(first) : id(`link-${firstRow ?? 0}-url`);
      document.getElementById(target)?.focus();
      return;
    }

    if (!signedIn) {
      setSaveError("Sign in to save your book.");
      authModal.open("signin");
      return;
    }

    setSaving(true);
    try {
      const input = {
        mode,
        title: form.title,
        subtitle: form.subtitle,
        genre: form.genre,
        language: form.language,
        description: form.description,
        releaseDate: form.date,
        isbn: form.isbn,
        publisher: form.publisher,
        discountPercent: form.discount,
        discountEnds: form.discountEnds,
        discountCode: form.discountCode,
        links,
        cover: cover?.file ?? null,
      } as const;
      if (editId) await updateBook(editId, { ...input, links }, existingCover);
      else await saveBook({ ...input, links });
      await loadRemote();
      setDone(mode);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setLinks([{ ...NEW_ROW }]);
    setLinkErrors({});
    setCover(null);
    setErrors({});
    setDone(null);
  };

  if (done) {
    return (
      <>
        <PageHeader title={editId ? "Edit Book" : "Add a Book"} subtitle="List your book, add where to buy it, and run a discount." />
        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-line bg-surface p-8 text-center">
          <CheckCircle2 size={44} className="mb-3 text-success" />
          <h2 className="font-serif text-2xl font-bold text-ink">{editId ? "Changes saved" : done === "published" ? "Book published!" : "Draft saved"}</h2>
          <p className="mt-2 text-sm text-muted">
            <span className="font-medium text-ink">{form.title}</span>{" "}
            {editId ? "was updated." : done === "published" ? "is now listed on BookNest." : "was saved. You can finish and publish it later."}
          </p>
          <div className="mt-6 flex gap-3">
            {!editId && (
              <button onClick={reset} className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-brand/10">
                Add another
              </button>
            )}
            <Link to="/profile" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-[#14181F] hover:brightness-110">
              View profile
            </Link>
          </div>
        </div>
      </>
    );
  }

  const border = (k: keyof Form) => (errors[k] ? "border-error" : "border-line");
  const aria = (k: keyof Form) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${id(k)}-err` : undefined });

  return (
    <>
      <PageHeader title={editId ? "Edit Book" : "Add a Book"} subtitle="List your book, add where to buy it, and run a discount." />
      {loadingBook && <p className="mb-4 text-sm text-muted">Loading your book…</p>}

      <form noValidate onSubmit={(e) => e.preventDefault()} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[200px_1fr]">
          {/* Cover upload */}
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={`relative flex aspect-[3/4] min-h-[200px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition md:aspect-auto md:h-full md:min-h-[260px] ${
                drag ? "border-brand bg-brand/10" : errors.cover ? "border-error" : "border-line"
              }`}
            >
              {cover || existingCover ? (
                <>
                  <img src={cover?.url ?? existingCover ?? ""} alt="Selected book cover preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setCover(null); setExistingCover(null); }}
                    aria-label="Remove cover"
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-1 p-4">
                  <ImagePlus size={30} className="mb-2 text-muted" />
                  <span className="text-sm font-semibold text-ink">Upload Book Cover</span>
                  <span className="text-xs text-muted">PNG, JPG or WEBP</span>
                  <span className="text-xs text-muted">Up to 5MB</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept={TYPES.join(",")} hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            {errors.cover && <p role="alert" className="mt-1.5 text-xs text-error">{errors.cover}</p>}
          </div>

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Book Title" required htmlFor={id("title")} error={errors.title}>
              <input id={id("title")} value={form.title} onChange={set("title")} placeholder="Enter book title" className={`${inputCls} ${border("title")}`} {...aria("title")} />
            </Field>
            <Field label="Subtitle" optional htmlFor={id("subtitle")}>
              <input id={id("subtitle")} value={form.subtitle} onChange={set("subtitle")} placeholder="Enter a subtitle" className={`${inputCls} border-line`} />
            </Field>
            <Field label="Genre" required htmlFor={id("genre")} error={errors.genre}>
              <div className="relative">
                <select id={id("genre")} value={form.genre} onChange={set("genre")} className={`${inputCls} ${border("genre")} cursor-pointer appearance-none pr-9 ${form.genre ? "" : "text-muted/70"}`} {...aria("genre")}>
                  <option value="" disabled>Select genre</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            </Field>
            <Field label="Language" htmlFor={id("language")}>
              <div className="relative">
                <select id={id("language")} value={form.language} onChange={set("language")} className={`${inputCls} border-line cursor-pointer appearance-none pr-9`}>
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            </Field>
          </div>
        </div>

        <div className="mt-4">
          <Field label="Description" required htmlFor={id("description")} error={errors.description}>
            <textarea id={id("description")} rows={4} value={form.description} onChange={set("description")} placeholder="Write a short description of your book…" className={`w-full resize-y rounded-lg border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none ${border("description")}`} {...aria("description")} />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Publication Date" htmlFor={id("date")}>
            <input id={id("date")} type="date" value={form.date} onChange={set("date")} className={`${inputCls} border-line`} />
          </Field>
          <Field label="ISBN" optional htmlFor={id("isbn")} error={errors.isbn}>
            <input id={id("isbn")} value={form.isbn} onChange={set("isbn")} placeholder="Enter ISBN" inputMode="numeric" className={`${inputCls} ${border("isbn")}`} {...aria("isbn")} />
          </Field>
          <Field label="Publisher" optional htmlFor={id("publisher")}>
            <input id={id("publisher")} value={form.publisher} onChange={set("publisher")} placeholder="Enter publisher" className={`${inputCls} border-line`} />
          </Field>
        </div>

        <div className="mt-6 rounded-xl border border-line p-4">
          <h2 className="text-sm font-semibold text-ink">Where can people buy your book?</h2>
          <p className="mt-0.5 text-xs text-muted">
            BookNest only lists books. Add a link for each version you sell: printed copy, eBook or audiobook, on Amazon or any other store.
            Readers see these when they tap Buy.
          </p>
          {errors.links && <p role="alert" className="mt-2 text-xs text-error">{errors.links}</p>}

          <div className="mt-3 space-y-3">
            {links.map((r, i) => (
              <div key={i}>
                <div className="grid gap-2 sm:grid-cols-[140px_140px_1fr_auto]">
                  <div className="relative">
                    <select aria-label="Version" value={r.format} onChange={(e) => setRow(i, { format: e.target.value as LinkFormat })} className={`${inputCls} border-line cursor-pointer appearance-none pr-9`}>
                      {LINK_FORMATS.map((f) => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                  </div>
                  <div className="relative">
                    <select aria-label="Store" value={r.store} onChange={(e) => setRow(i, { store: e.target.value as LinkStore })} className={`${inputCls} border-line cursor-pointer appearance-none pr-9`}>
                      {(Object.keys(STORE_LABELS) as LinkStore[]).map((s) => <option key={s} value={s}>{STORE_LABELS[s]}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                  </div>
                  <input
                    id={id(`link-${i}-url`)}
                    aria-label="Link"
                    value={r.url}
                    onChange={(e) => setRow(i, { url: e.target.value })}
                    placeholder={r.store === "amazon" ? "https://amazon.com/…" : "https://…"}
                    inputMode="url"
                    aria-invalid={!!linkErrors[i]}
                    className={`${inputCls} ${linkErrors[i] ? "border-error" : "border-line"}`}
                  />
                  <button type="button" onClick={() => removeRow(i)} aria-label="Remove link" className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-muted hover:bg-brand/10 hover:text-ink">
                    <X size={16} />
                  </button>
                </div>
                {linkErrors[i] && <p role="alert" className="mt-1 text-xs text-error">{linkErrors[i]}</p>}
              </div>
            ))}
          </div>

          {links.length < MAX_LINKS && (
            <button type="button" onClick={addRow} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              <Plus size={15} /> Add another link
            </button>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-line p-4">
          <h2 className="text-sm font-semibold text-ink">Discount <span className="font-normal text-muted">(optional)</span></h2>
          <p className="mt-0.5 text-xs text-muted">
            Shows an “% off” badge on your book. The discount itself must be set up where you sell (for example on Amazon).
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Field label="Discount %" htmlFor={id("discount")} error={errors.discount}>
              <input id={id("discount")} type="number" min={1} max={99} step={1} value={form.discount} onChange={set("discount")} placeholder="e.g. 20" inputMode="numeric" className={`${inputCls} ${border("discount")}`} {...aria("discount")} />
            </Field>
            <Field label="Ends on" optional htmlFor={id("discountEnds")} error={errors.discountEnds}>
              <input id={id("discountEnds")} type="date" min={today()} value={form.discountEnds} onChange={set("discountEnds")} className={`${inputCls} ${border("discountEnds")}`} {...aria("discountEnds")} />
            </Field>
            <Field label="Discount code" optional htmlFor={id("discountCode")} error={errors.discountCode}>
              <input id={id("discountCode")} value={form.discountCode} onChange={set("discountCode")} placeholder="e.g. SPRING20" className={`${inputCls} ${border("discountCode")}`} {...aria("discountCode")} />
            </Field>
          </div>
        </div>

        {saveError && (
          <p role="alert" className="mt-6 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
            {saveError}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button type="button" disabled={saving} onClick={() => submit("draft")} className="rounded-xl border border-line px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand/10 disabled:opacity-60">
            {saving ? "Saving…" : "Save as Draft"}
          </button>
          <button type="button" disabled={saving} onClick={() => submit("published")} className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-[#14181F] transition hover:brightness-110 disabled:opacity-60">
            {saving ? "Saving…" : "Publish Book"}
          </button>
        </div>
      </form>
    </>
  );
}
