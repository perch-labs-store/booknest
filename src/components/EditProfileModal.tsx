import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Profile } from "../data/profile";
import { SOCIALS, normalizeSocial, type SocialKey, type SocialLinks } from "../data/socials";
import { SocialIcon } from "./SocialLinks";
import { genres as ALL_GENRES } from "../data/genres";
import { LANGUAGES, LANGUAGE_MAX } from "../data/languages";

type Draft = Pick<Profile, "name" | "realName" | "username" | "bio" | "about" | "location" | "website">;
type Errors = Partial<Record<keyof Draft, string>>;

const BIO_MAX = 160;
const ABOUT_MAX = 1500;
const GENRE_MAX = 3;
const inputCls =
  "h-11 w-full rounded-lg border bg-bg px-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none";

interface Props {
  profile: Profile;
  onSave: (patch: Draft & { socials: SocialLinks; genres: string[]; languages: string[] }) => void | Promise<void>;
  /** Message from a failed save, shown above the buttons. */
  error?: string | null;
  onClose: () => void;
}

export default function EditProfileModal({ profile, onSave, onClose, error }: Props) {
  const [saving, setSaving] = useState(false);
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const [draft, setDraft] = useState<Draft>({
    name: profile.name,
    realName: profile.realName,
    username: profile.username,
    bio: profile.bio,
    about: profile.about,
    location: profile.location,
    website: profile.website,
  });
  const [pickedLangs, setPickedLangs] = useState<string[]>(profile.languages);
  const [pickedGenres, setPickedGenres] = useState<string[]>(profile.genres);
  const [errors, setErrors] = useState<Errors>({});
  // What the author typed for each social platform (a @handle or a link).
  const [socials, setSocials] = useState<Record<SocialKey, string>>(
    () => Object.fromEntries(SOCIALS.map((s) => [s.key, profile.socials[s.key] ?? ""])) as Record<SocialKey, string>
  );
  const [socialErrors, setSocialErrors] = useState<Partial<Record<SocialKey, string>>>({});
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);

  const set = (k: keyof Draft) => (e: { target: { value: string } }) => {
    setDraft((d) => ({ ...d, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const save = () => {
    const er: Errors = {};
    if (!draft.name.trim()) er.name = "Enter your name.";
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(draft.username)) er.username = "3–20 letters, numbers or underscores.";
    if (draft.about.length > ABOUT_MAX) er.about = `Your story must be ${ABOUT_MAX} characters or fewer.`;
    if (draft.bio.length > BIO_MAX) er.bio = `Bio must be ${BIO_MAX} characters or fewer.`;
    const site = draft.website.trim();
    if (site && !/^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(site)) er.website = "Enter a valid website, e.g. yoursite.com.";
    setErrors(er);

    const cleanSocials: SocialLinks = {};
    const sErr: Partial<Record<SocialKey, string>> = {};
    for (const { key, label } of SOCIALS) {
      const url = normalizeSocial(key, socials[key]);
      if (url === null) sErr[key] = `Enter a valid ${label} link or handle.`;
      else if (url) cleanSocials[key] = url;
    }
    setSocialErrors(sErr);

    const first = Object.keys(er)[0] ?? (Object.keys(sErr)[0] && `social-${Object.keys(sErr)[0]}`);
    if (first) return document.getElementById(id(first))?.focus();
    setSaving(true);
    Promise.resolve(onSave({
      socials: cleanSocials,
      name: draft.name.trim(),
      realName: draft.realName.trim(),
      username: draft.username,
      bio: draft.bio.trim(),
      about: draft.about.trim(),
      genres: pickedGenres,
      languages: pickedLangs,
      location: draft.location.trim(),
      website: site.replace(/^https?:\/\//i, "").replace(/\/$/, ""),
    })).finally(() => setSaving(false));
  };

  const field = (k: keyof Draft, label: string, props: { placeholder?: string; optional?: boolean; prefix?: string } = {}) => (
    <div>
      <label htmlFor={id(k)} className="mb-1.5 block text-xs font-semibold text-ink">
        {label}
        {props.optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      <div className="relative">
        {props.prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{props.prefix}</span>}
        <input
          id={id(k)}
          ref={k === "name" ? firstRef : undefined}
          value={draft[k]}
          onChange={set(k)}
          placeholder={props.placeholder}
          aria-invalid={!!errors[k]}
          aria-describedby={errors[k] ? `${id(k)}-err` : undefined}
          className={`${inputCls} ${errors[k] ? "border-error" : "border-line"} ${props.prefix ? "pl-7" : ""}`}
        />
      </div>
      {errors[k] && (
        <p id={`${id(k)}-err`} role="alert" className="mt-1 text-xs text-error">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={id("title")} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 id={id("title")} className="font-serif text-2xl font-bold text-ink">Edit Profile</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-brand/10 hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {field("name", "Author / pen name", { placeholder: "The name on your books" })}
          <div>
            {field("realName", "Real name", { placeholder: "Your legal name", optional: true })}
            <p className="mt-1 text-xs text-muted">Private: only you can see this. Readers only see your author or pen name above.</p>
          </div>
          {field("username", "Username", { prefix: "@", placeholder: "username" })}
          <div>
            <label htmlFor={id("bio")} className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink">
              <span>Tagline <span className="font-normal text-muted">(short, shown under your name)</span></span>
              <span className={`font-normal ${draft.bio.length > BIO_MAX ? "text-error" : "text-muted"}`}>{draft.bio.length}/{BIO_MAX}</span>
            </label>
            <textarea
              id={id("bio")}
              rows={3}
              value={draft.bio}
              onChange={set("bio")}
              placeholder="One line about you and your books"
              aria-invalid={!!errors.bio}
              aria-describedby={errors.bio ? `${id("bio")}-err` : undefined}
              className={`w-full resize-none rounded-lg border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none ${errors.bio ? "border-error" : "border-line"}`}
            />
            {errors.bio && <p id={`${id("bio")}-err`} role="alert" className="mt-1 text-xs text-error">{errors.bio}</p>}
          </div>
          <div>
            <label htmlFor={id("about")} className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink">
              <span>About you <span className="font-normal text-muted">(your author story)</span></span>
              <span className={`font-normal ${draft.about.length > ABOUT_MAX ? "text-error" : "text-muted"}`}>{draft.about.length}/{ABOUT_MAX}</span>
            </label>
            <textarea
              id={id("about")}
              rows={6}
              value={draft.about}
              onChange={set("about")}
              placeholder="Where you write from, what inspires your books, where new readers should start…"
              aria-invalid={!!errors.about}
              className={`w-full resize-y rounded-lg border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none ${errors.about ? "border-error" : "border-line"}`}
            />
            {errors.about && <p role="alert" className="mt-1 text-xs text-error">{errors.about}</p>}
          </div>

          <fieldset>
            <legend className="mb-1 flex w-full items-center justify-between text-xs font-semibold text-ink">
              <span>Genres you write <span className="font-normal text-muted">(up to {GENRE_MAX})</span></span>
              <span className="font-normal text-muted">{pickedGenres.length}/{GENRE_MAX}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ALL_GENRES.map((g) => {
                const on = pickedGenres.includes(g.name);
                const full = !on && pickedGenres.length >= GENRE_MAX;
                return (
                  <button
                    key={g.slug}
                    type="button"
                    aria-pressed={on}
                    disabled={full}
                    onClick={() => setPickedGenres((x) => (on ? x.filter((n) => n !== g.name) : [...x, g.name]))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-brand bg-brand/25 text-ink" : "border-line text-muted hover:text-ink"} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 flex w-full items-center justify-between text-xs font-semibold text-ink">
              <span>Languages you write in <span className="font-normal text-muted">(up to {LANGUAGE_MAX})</span></span>
              <span className="font-normal text-muted">{pickedLangs.length}/{LANGUAGE_MAX}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => {
                const on = pickedLangs.includes(l);
                const full = !on && pickedLangs.length >= LANGUAGE_MAX;
                return (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={on}
                    disabled={full}
                    onClick={() => setPickedLangs((x) => (on ? x.filter((n) => n !== l) : [...x, l]))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-brand bg-brand/25 text-ink" : "border-line text-muted hover:text-ink"} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("location", "Location", { placeholder: "City, Country", optional: true })}
            {field("website", "Website", { placeholder: "yoursite.com", optional: true })}
          </div>

          <fieldset>
            <legend className="mb-1 text-xs font-semibold text-ink">Social links <span className="font-normal text-muted">(optional)</span></legend>
            <p className="mb-3 text-xs text-muted">Paste a link or just your @handle. These show on your author page.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SOCIALS.map((s) => (
                <div key={s.key}>
                  <label htmlFor={id(`social-${s.key}`)} className="sr-only">{s.label}</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"><SocialIcon name={s.key} size={16} /></span>
                    <input
                      id={id(`social-${s.key}`)}
                      value={socials[s.key]}
                      onChange={(e) => {
                        setSocials((x) => ({ ...x, [s.key]: e.target.value }));
                        setSocialErrors((x) => ({ ...x, [s.key]: undefined }));
                      }}
                      placeholder={`${s.label}: ${s.placeholder}`}
                      aria-invalid={!!socialErrors[s.key]}
                      aria-describedby={socialErrors[s.key] ? `${id(`social-${s.key}`)}-err` : undefined}
                      className={`${inputCls} pl-9 ${socialErrors[s.key] ? "border-error" : "border-line"}`}
                    />
                  </div>
                  {socialErrors[s.key] && (
                    <p id={`${id(`social-${s.key}`)}-err`} role="alert" className="mt-1 text-xs text-error">{socialErrors[s.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button onClick={onClose} className="rounded-xl border border-line px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand/10">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-[#14181F] transition hover:brightness-110 disabled:opacity-60">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
