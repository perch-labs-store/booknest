import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Share2, X } from "lucide-react";
import QRCode from "qrcode";

interface Props {
  authorId: string | null;
  name: string;
  /** Classes for the trigger button, so it fits wherever it's placed. */
  className?: string;
}

/** "Share" button: copy the author page link, use the phone's share sheet, or download a QR code (handy at book signings). */
export default function ShareProfile({ authorId, name, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const url = authorId ? `${window.location.origin}/authors/${authorId}` : "";

  useEffect(() => {
    if (!open || !url) return;
    QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: "#14181F", light: "#FFFFFF" } }).then(setQr).catch(() => setQr(""));
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, url]);

  if (!authorId) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the link is still selectable in the field */
    }
  };
  const nativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Share2 size={15} /> Share
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Share author page" className="relative w-full max-w-sm rounded-t-2xl border border-line bg-surface p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <button ref={closeRef} onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 rounded-md p-1.5 text-muted hover:bg-brand/10 hover:text-ink"><X size={18} /></button>
            <h2 className="font-serif text-xl font-bold text-ink">Share {name || "your page"}</h2>
            <p className="mt-1 text-sm text-muted">Anyone with this link or QR code lands on the author page.</p>

            <div className="mt-4 flex gap-2">
              <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Author page link" className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-sm text-ink" />
              <button onClick={copy} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-semibold text-[#14181F] hover:brightness-110">
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {qr && (
              <div className="mt-5 flex flex-col items-center">
                <img src={qr} alt={`QR code for ${name}'s author page`} className="h-44 w-44 rounded-xl border border-line" />
                <a href={qr} download={`${authorId}-qr.png`} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"><Download size={14} /> Download QR code</a>
              </div>
            )}

            {nativeShare && (
              <button onClick={() => navigator.share({ title: name, url }).catch(() => undefined)} className="mt-4 w-full rounded-xl border border-line py-2.5 text-sm font-semibold text-ink hover:bg-brand/10">
                Share via…
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
