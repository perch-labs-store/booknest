import { useEffect, useId, useRef, useState } from "react";
import BrandMark from "./BrandMark";
import { useProfile } from "../context/ProfileContext";
import { ROOT_DOMAIN, suggestUsername } from "../lib/host";

const inputCls =
  "h-11 w-full rounded-lg border bg-bg px-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none";

/** Shown once, right after a new account is created (email or Google): asks for the author name and a few optional details. */
export default function WelcomePrompt() {
  const { needsWelcome, finishWelcome, profile, update } = useProfile();
  const uid = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState<{ name?: string; username?: string }>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the account (Google gives a real name; email sign-ups start as "Reader").
  useEffect(() => {
    if (!needsWelcome) return;
    setName(profile.name && profile.name !== "Reader" ? profile.name : "");
    setUsername(suggestUsername(profile.name && profile.name !== "Reader" ? profile.name : ""));
    setUsernameTouched(false);
    nameRef.current?.focus();
  }, [needsWelcome, profile.name]);

  if (!needsWelcome) return null;

  const save = async () => {
    const er: typeof errors = {};
    if (!name.trim()) er.name = "Enter the name readers will see.";
    const finalUsername = username || suggestUsername(name);
    if (finalUsername && !/^[a-zA-Z0-9_]{3,20}$/.test(finalUsername)) er.username = "3–20 letters, numbers or underscores.";
    setErrors(er);
    if (er.name || er.username) return;
    setSaving(true);
    setError(null);
    const err = await update({ name: name.trim(), username: finalUsername, bio: bio.trim().slice(0, 160) });
    setSaving(false);
    if (err) return setError(err);
    finishWelcome();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby={`${uid}-t`} className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <BrandMark size={48} className="mb-2" />
          <h2 id={`${uid}-t`} className="font-serif text-2xl font-bold text-ink">Welcome to Fablebook</h2>
          <p className="mt-1 text-sm text-muted">Tell readers who you are. You can change this any time in Edit Profile.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor={`${uid}-n`} className="mb-1.5 block text-xs font-semibold text-ink">Author name</label>
            <input ref={nameRef} id={`${uid}-n`} value={name} onChange={(e) => { setName(e.target.value); if (!usernameTouched) setUsername(suggestUsername(e.target.value)); setErrors((x) => ({ ...x, name: undefined })); }} maxLength={80} placeholder="The name on your books" autoComplete="name" className={`${inputCls} ${errors.name ? "border-error" : "border-line"}`} />
            {errors.name && <p role="alert" className="mt-1 text-xs text-error">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor={`${uid}-u`} className="mb-1.5 block text-xs font-semibold text-ink">Username <span className="font-normal text-muted">(optional)</span></label>
            <input id={`${uid}-u`} value={username} onChange={(e) => { setUsername(e.target.value.replace(/\s/g, "")); setUsernameTouched(true); setErrors((x) => ({ ...x, username: undefined })); }} maxLength={20} placeholder="yourname" autoCapitalize="none" className={`${inputCls} ${errors.username ? "border-error" : "border-line"}`} />
            {errors.username && <p role="alert" className="mt-1 text-xs text-error">{errors.username}</p>}
            {ROOT_DOMAIN && !errors.username && <p className="mt-1 text-xs text-muted">Your author website: {(username || "yourname").toLowerCase().replace(/_/g, "-")}.{ROOT_DOMAIN}. You can change it any time.</p>}
          </div>
          <div>
            <label htmlFor={`${uid}-b`} className="mb-1.5 block text-xs font-semibold text-ink">Short bio <span className="font-normal text-muted">(optional)</span></label>
            <textarea id={`${uid}-b`} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={2} placeholder="What do you write?" className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none" />
          </div>
          {error && <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">{error}</p>}
          <button type="button" onClick={save} disabled={saving} className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-[#14181F] transition hover:brightness-110 disabled:opacity-70">
            {saving ? "Saving…" : "Save and continue"}
          </button>
          <button type="button" onClick={finishWelcome} className="w-full text-center text-sm text-muted hover:text-ink">Skip for now</button>
        </div>
      </div>
    </div>
  );
}
