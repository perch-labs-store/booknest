import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { enablePush, getPushState, syncPushSubscription, type PushState } from "../lib/push";

const DISMISSED_KEY = "booknest:push-dismissed";
const ASK_AGAIN_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

const recentlyDismissed = () => {
  try {
    const t = Number(localStorage.getItem(DISMISSED_KEY));
    return t > 0 && Date.now() - t < ASK_AGAIN_AFTER_MS;
  } catch {
    return false;
  }
};

/** Small opt-in card asking signed-in users if they want live notifications. Turning it on is a click, as browsers require. */
export default function PushPrompt() {
  const { signedIn, loading } = useAuth();
  const { needsWelcome, authorId } = useProfile();
  const [state, setState] = useState<PushState | null>(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !signedIn || !authorId) return setState(null);
    getPushState().then(setState);
    syncPushSubscription().catch(() => {});
  }, [signedIn, loading, authorId]);

  // Only ask when it can work, nobody has answered yet, and the welcome form isn't open.
  if (hidden || needsWelcome || state !== "off" || recentlyDismissed()) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      /* private mode: just hide for this visit */
    }
    setHidden(true);
  };

  const turnOn = async () => {
    setBusy(true);
    setError("");
    try {
      const next = await enablePush();
      if (next === "on") setHidden(true);
      else if (next === "blocked") setError("Notifications are blocked. Allow them in your browser's site settings.");
      else dismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-label="Turn on notifications" className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:left-auto sm:right-6 lg:bottom-6">
      <button onClick={dismiss} aria-label="Close" className="absolute right-3 top-3 text-muted hover:text-ink">
        <X size={16} />
      </button>
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/20 text-accent">
          <Bell size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Get live notifications?</p>
          <p className="mt-0.5 text-xs text-muted">Know right away when someone likes your book, follows you, or an author you follow posts.</p>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={turnOn} disabled={busy} className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-[#14181F] disabled:opacity-60">
              {busy ? "Turning on…" : "Turn on"}
            </button>
            <button onClick={dismiss} className="rounded-full px-4 py-1.5 text-xs font-medium text-muted hover:text-ink">
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
