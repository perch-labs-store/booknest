import { useState } from "react";
import { Download, Share } from "lucide-react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

export default function InstallButton({ collapsed }: { collapsed: boolean }) {
  const { canInstall, showIosHint, install } = useInstallPrompt();
  const [hint, setHint] = useState(false);

  // Hidden once installed, or when the browser can't install (e.g. Firefox desktop).
  if (!canInstall && !showIosHint) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => (canInstall ? install() : setHint((h) => !h))}
        title="Install app"
        className={`flex w-full items-center gap-2 rounded-lg bg-brand/20 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-brand/30 ${
          collapsed ? "lg:justify-center lg:px-0" : ""
        }`}
      >
        <Download size={18} className="shrink-0 text-accent" />
        <span className={collapsed ? "lg:hidden" : ""}>Install app</span>
      </button>
      {hint && !canInstall && (
        <p className="mt-2 rounded-lg border border-line px-3 py-2 text-xs text-muted">
          Tap <Share size={12} className="mx-0.5 inline align-[-1px]" /> Share, then{" "}
          <span className="text-ink">Add to Home Screen</span>.
        </p>
      )}
    </div>
  );
}
