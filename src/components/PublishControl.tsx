import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Copy, ExternalLink, Globe, Loader2, LogIn } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useProfile } from "../context/ProfileContext";
import { getMyPublishedSite, isReservedSubdomain, publishSite, subdomainFor, unpublishSite } from "../data/remote";
import { findTemplate, type SiteDoc } from "../data/templates";
import { ROOT_DOMAIN, siteHost, siteUrl } from "../lib/host";
import { isSupabaseConfigured } from "../lib/supabase";

interface Props {
  templateId: string;
  templateName: string;
  doc: SiteDoc;
  /** False while the author's saved site is still loading, so an old copy is never published by accident. */
  ready: boolean;
}

interface Published {
  subdomain: string;
  templateId: string;
  doc: unknown;
  publishedAt: string;
}

/** JSON with sorted keys, so the live copy (Postgres jsonb reorders keys) compares equal to the editor's doc. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map((x) => stable(x === undefined ? null : x)).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v) ?? "null";
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Please try again.");
const primaryBtn = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";
const secondaryBtn = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-brand/10";

const panelCls = "fixed inset-x-3 top-[4.25rem] z-30 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl border border-line bg-surface p-4 text-ink shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80";

/** Publish button for the template editor's top bar, with a small panel for the live-site actions. */
export default function PublishControl({ templateId, templateName, doc, ready }: Props) {
  const navigate = useNavigate();
  const { signedIn, loading: authLoading } = useAuth();
  const { open: openSignIn } = useAuthModal();
  const { profile, authorId, update } = useProfile();

  const [open, setOpen] = useState(false);
  const [published, setPublished] = useState<Published | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState<"publish" | "unpublish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [editingAddr, setEditingAddr] = useState(false);
  const [addrDraft, setAddrDraft] = useState("");
  const [addrError, setAddrError] = useState<string | null>(null);
  const [addrSaving, setAddrSaving] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Set when a signed-out visitor starts signing in from the panel, so the panel can reopen once they're in.
  const cameToPublish = useRef(false);

  const configured = Boolean(ROOT_DOMAIN);

  // Is this author already live? (Checked once signed in.)
  useEffect(() => {
    if (!signedIn || !configured) {
      setPublished(null);
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    getMyPublishedSite()
      .then((p) => !cancelled && setPublished(p))
      .catch((e) => !cancelled && setError(messageOf(e)))
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [signedIn, configured]);

  useEffect(() => {
    if (signedIn && cameToPublish.current) {
      cameToPublish.current = false;
      setOpen(true);
    }
  }, [signedIn]);

  // Close on outside click or Esc. The panel is marked data-modal so the editor's own Esc handler leaves it alone.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const username = profile.username.trim();
  const profileLoaded = authorId !== null;
  const mySubdomain = username ? subdomainFor(username) : "";

  const isThisTemplate = published?.templateId === templateId;
  const changed = useMemo(() => (published && isThisTemplate ? stable(doc) !== stable(published.doc) : false), [doc, published, isThisTemplate]);
  // If the username changed since publishing, updating moves the site to the new address.
  const moving = Boolean(published && mySubdomain && mySubdomain !== published.subdomain);
  const otherName = published && !isThisTemplate ? findTemplate(published.templateId)?.name ?? "another template" : null;

  const publish = async () => {
    const wasLive = Boolean(published);
    const snapshot = doc;
    setBusy("publish");
    setError(null);
    setNotice(null);
    try {
      const { subdomain } = await publishSite(templateId, snapshot, { title: profile.name || templateName, authorName: profile.name });
      setPublished({ subdomain, templateId, doc: snapshot, publishedAt: published?.publishedAt ?? new Date().toISOString() });
      setNotice(wasLive ? "Site updated." : "Your site is live.");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(null);
    }
  };

  const startEditAddr = () => {
    setAddrDraft(username.toLowerCase());
    setAddrError(null);
    setEditingAddr(true);
  };

  const saveAddr = async () => {
    const next = addrDraft.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(next)) return setAddrError("Use 3 to 20 letters, numbers or underscores.");
    if (isReservedSubdomain(subdomainFor(next))) return setAddrError("That name is reserved. Try another.");
    if (next === username) return setEditingAddr(false);
    setAddrSaving(true);
    setAddrError(null);
    const err = await update({ username: next });
    setAddrSaving(false);
    if (err) return setAddrError(err);
    setEditingAddr(false);
    setNotice(published ? "Address changed. Press Update site to move your live site to it." : "Address changed.");
  };

  /** The address line with a small "Change" control that swaps it for an input. */
  const addressEditor = (
    <div className="mt-2">
      {editingAddr ? (
        <div>
          <div className="flex items-center rounded-lg border border-line bg-bg focus-within:border-brand">
            <input
              value={addrDraft}
              onChange={(e) => {
                setAddrDraft(e.target.value.replace(/\s/g, ""));
                setAddrError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && saveAddr()}
              maxLength={20}
              autoCapitalize="none"
              autoFocus
              aria-label="Site address"
              className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm focus:outline-none"
            />
            <span className="pr-2.5 font-mono text-xs text-muted">.{ROOT_DOMAIN}</span>
          </div>
          {addrError && <p role="alert" className="mt-1 text-xs text-error">{addrError}</p>}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={saveAddr} disabled={addrSaving} className={`${primaryBtn} flex-1`}>
              {addrSaving ? <Loader2 size={14} className="animate-spin" /> : null} Save address
            </button>
            <button type="button" onClick={() => setEditingAddr(false)} disabled={addrSaving} className={secondaryBtn}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={startEditAddr} className="text-xs font-medium text-brand hover:underline">
          Change address
        </button>
      )}
    </div>
  );

  const unpublish = async () => {
    setConfirmUnpublish(false);
    setBusy("unpublish");
    setError(null);
    setNotice(null);
    try {
      await unpublishSite();
      setPublished(null);
      setNotice("Your site is offline.");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    if (!published) return;
    try {
      await navigator.clipboard.writeText(siteUrl(published.subdomain));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the link. Select and copy it from the address shown instead.");
    }
  };

  /* ---- Trigger button ---- */

  if (!configured) {
    return (
      <span title="Publishing isn't set up on this site yet" className="inline-flex">
        <button type="button" disabled aria-label="Publish" className="inline-flex items-center gap-1.5 rounded-lg border border-line p-2 text-sm font-medium text-muted opacity-50 sm:px-3">
          <Globe size={18} />
          <span className="hidden sm:inline">Publish</span>
        </button>
      </span>
    );
  }

  if (!signedIn) {
    // Explain why first, then let the visitor open the sign-in modal themselves.
    const signIn = (mode: "signin" | "signup") => {
      cameToPublish.current = true;
      setOpen(false);
      openSignIn(mode);
    };
    return (
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          disabled={authLoading}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Publish (sign in first)"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line p-2 text-sm font-medium hover:bg-brand/10 disabled:opacity-50 sm:px-3"
        >
          <Globe size={18} />
          <span className="hidden sm:inline">Publish</span>
        </button>

        {open && (
          <div data-modal role="dialog" aria-label="Sign in to publish" className={panelCls}>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <LogIn size={16} className="text-brand" /> Sign in to publish
            </p>
            <p className="mt-1.5 text-sm text-muted">You need an account to put your site online. Your site gets its own address, like:</p>
            <p className="mt-2 break-all rounded-lg bg-bg px-2.5 py-2 font-mono text-sm font-semibold">{siteHost("yourname")}</p>
            <button type="button" onClick={() => signIn("signin")} className={`${primaryBtn} mt-3 w-full`}>
              Sign in
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              New here?{" "}
              <button type="button" onClick={() => signIn("signup")} className="font-medium text-brand hover:underline">
                Create an account
              </button>
            </p>
          </div>
        )}
      </div>
    );
  }

  const live = Boolean(published);
  const needsUpdate = live && (!isThisTemplate || changed || moving);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={live ? "Your published site" : "Publish"}
        className={`relative inline-flex items-center gap-1.5 rounded-lg p-2 text-sm font-semibold sm:px-3 ${live ? "border border-line hover:bg-brand/10" : "bg-brand text-black hover:opacity-90"}`}
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
        <span className="hidden sm:inline">{live ? "Published" : "Publish"}</span>
        {live && <span aria-hidden className={`absolute right-1 top-1 h-2 w-2 rounded-full sm:static sm:ml-0.5 ${needsUpdate ? "bg-amber-400" : "bg-success"}`} />}
      </button>

      {open && (
        <div
          data-modal
          role="dialog"
          aria-label="Publish your site"
          className={panelCls}
        >
          {!isSupabaseConfigured ? (
            <p className="text-sm text-muted">Publishing needs the database. Add your Supabase keys to .env.local and restart the app.</p>
          ) : !ready || checking || (!profileLoaded && !error) ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 size={14} className="animate-spin" /> {checking ? "Checking your site…" : "Loading…"}
            </p>
          ) : !username ? (
            <div>
              <p className="text-sm">Set a username in your profile first. Your site address is built from it.</p>
              <button type="button" onClick={() => navigate("/profile")} className={`${primaryBtn} mt-3 w-full`}>
                Go to profile
              </button>
            </div>
          ) : !published ? (
            <div>
              <p className="text-xs text-muted">Your site will be live at</p>
              <p className="mt-0.5 break-all font-mono text-sm font-semibold">{siteHost(mySubdomain)}</p>
              {addressEditor}
              <button type="button" onClick={publish} disabled={busy !== null} className={`${primaryBtn} mt-3 w-full`}>
                {busy === "publish" ? <Loader2 size={14} className="animate-spin" /> : null}
                {busy === "publish" ? "Publishing…" : "Publish"}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted">{isThisTemplate ? "Your site is live at" : `Your live site uses ${otherName}, at`}</p>
              <p className="mt-0.5 break-all font-mono text-sm font-semibold">{siteHost(published.subdomain)}</p>
              {moving && <p className="mt-1 text-xs text-muted">Updating will move it to {siteHost(mySubdomain)}, to match your username.</p>}
              {addressEditor}
              {!isThisTemplate ? (
                <p className="mt-2 text-xs text-muted">Publishing this template replaces your live site.</p>
              ) : (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                  {changed || moving ? (
                    "You have changes that aren't live yet."
                  ) : (
                    <>
                      <Check size={12} className="text-success" /> Up to date
                    </>
                  )}
                </p>
              )}
              <button type="button" onClick={publish} disabled={busy !== null || (isThisTemplate && !changed && !moving)} className={`${primaryBtn} mt-3 w-full`}>
                {busy === "publish" ? <Loader2 size={14} className="animate-spin" /> : null}
                {busy === "publish" ? "Updating…" : isThisTemplate ? "Update site" : "Publish this template"}
              </button>
              <div className="mt-2 flex gap-2">
                <a href={siteUrl(published.subdomain)} target="_blank" rel="noopener noreferrer" className={`${secondaryBtn} flex-1`}>
                  <ExternalLink size={14} /> View site
                </a>
                <button type="button" onClick={copyLink} aria-label="Copy site link" title="Copy link" className={secondaryBtn}>
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setConfirmUnpublish(true);
                }}
                disabled={busy !== null}
                className="mt-3 w-full text-center text-xs text-muted hover:text-error disabled:opacity-50"
              >
                {busy === "unpublish" ? "Unpublishing…" : "Unpublish"}
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
              {error}
            </p>
          )}
          {notice && !error && (
            <p role="status" className="mt-3 flex items-center gap-1 text-xs text-success">
              <Check size={12} /> {notice}
            </p>
          )}
        </div>
      )}

      {confirmUnpublish && published && (
        <ConfirmModal
          danger
          title="Take your site offline?"
          message={`${siteHost(published.subdomain)} will stop working. Your template and edits are kept, and you can publish again any time.`}
          confirmLabel="Unpublish"
          onConfirm={unpublish}
          onCancel={() => setConfirmUnpublish(false)}
        />
      )}
    </div>
  );
}
