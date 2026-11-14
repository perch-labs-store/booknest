import { useEffect, useState } from "react";
import { disablePush, enablePush, getPushState, type PushState } from "../lib/push";

export function Toggle({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-brand" : "bg-line"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

const PUSH_HINT: Record<PushState, string> = {
  on: "This device gets a notification when something happens.",
  off: "Get a notification on this device for likes, follows and posts.",
  blocked: "Blocked in your browser. Allow notifications for this site in its settings, then come back.",
  "needs-install": "On iPhone and iPad, first add BookNest to your Home Screen (Share → Add to Home Screen), then open it from there.",
  unsupported: "This browser doesn't support push notifications.",
};

export function PushToggle() {
  const [state, setState] = useState<PushState | null>(null);
  const [error, setError] = useState("");
  useEffect(() => void getPushState().then(setState), []);
  if (!state) return null;
  const disabled = state !== "on" && state !== "off";
  const change = async (v: boolean) => {
    setError("");
    try {
      if (v) setState(await enablePush());
      else {
        await disablePush();
        setState("off");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };
  return (
    <div className={disabled ? "opacity-70" : ""}>
      <Toggle label="Push notifications" desc={error || PUSH_HINT[state]} on={state === "on"} onChange={(v) => !disabled && change(v)} />
    </div>
  );
}

