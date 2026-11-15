import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { imageKind, imageSrc, isUploadedImage, uploadedImageUrl, uploadedImageValue, type ImageKind } from "../data/templates";
import { currentUserId, saveSiteImage } from "../data/remote";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { supabase } from "../lib/supabase";
import { prepareImage, UPLOAD_TYPES } from "../utils/image";

const MAX_BYTES = 15 * 1024 * 1024; // before shrinking; the stored copy is much smaller

/** The last few pictures this person uploaded, so they can reuse one without uploading it again. */
const recentsKey = () => `booknest:site-uploads:${currentUserId() ?? "anon"}`;
const loadRecents = (): string[] => {
  try {
    const list = JSON.parse(localStorage.getItem(recentsKey()) ?? "[]");
    return Array.isArray(list) ? list.filter((u) => typeof u === "string") : [];
  } catch {
    return [];
  }
};
const addRecent = (url: string) => {
  try {
    localStorage.setItem(recentsKey(), JSON.stringify([url, ...loadRecents().filter((u) => u !== url)].slice(0, 12)));
  } catch {
    /* storage unavailable: the picture is still applied */
  }
};

interface Props {
  value: string | undefined;
  onChange: (id: string) => void;
  editable: boolean;
  /** Wrapper classes: set the size/shape here (the image fills it). */
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/** An image from the cover / portrait library, or one the author uploaded. In edit mode, click it to swap. */
export default function EditableImage({ value, onChange, editable, className = "", style, alt = "" }: Props) {
  const [open, setOpen] = useState(false);
  const kind = imageKind(value);
  const src = imageSrc(value);

  return (
    <>
      <div className={`relative overflow-hidden ${className}`} style={style}>
        {src ? (
          <img src={src} alt={alt} loading="lazy" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-current opacity-10" />
        )}
        {editable && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Change image"
            className="group absolute inset-0 flex items-center justify-center bg-black/0 text-white transition hover:bg-black/45 focus-visible:bg-black/45"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              <ImagePlus size={14} /> Change image
            </span>
          </button>
        )}
      </div>
      {open && <Picker kind={kind} current={value} onPick={(id) => { onChange(id); setOpen(false); }} onClose={() => setOpen(false)} />}
    </>
  );
}

function Picker({ kind, current, onPick, onClose }: { kind: ImageKind; current?: string; onPick: (id: string) => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Upload an image"
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-line bg-surface text-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line p-3">
          <p className="px-1 text-sm font-semibold">Upload your image</p>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto rounded-md p-1.5 text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <UploadPanel kind={kind} current={current} onPick={onPick} />
      </div>
    </div>,
    document.body,
  );
}

/** Upload your own picture instead of a stock cover or portrait. */
function UploadPanel({ kind, current, onPick }: { kind: ImageKind; current?: string; onPick: (id: string) => void }) {
  const { signedIn, loading } = useAuth();
  const authModal = useAuthModal();
  const fileRef = useRef<HTMLInputElement>(null);
  const as = kind; // the picture takes the shape of the space it replaces
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const [recents] = useState<string[]>(() => {
    const list = loadRecents();
    const cur = isUploadedImage(current) ? uploadedImageUrl(current) : null;
    return cur && !list.includes(cur) ? [cur, ...list] : list;
  });

  if (!supabase) {
    return <p className="p-6 text-sm text-muted">Uploading isn't set up on this site yet.</p>;
  }
  if (!loading && !signedIn) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <UploadCloud size={32} className="text-muted" />
        <p className="font-semibold text-ink">Sign in to upload your own photos</p>
        <p className="max-w-xs text-sm text-muted">Your pictures are saved to your account, so they're still there next time you open your site.</p>
        <button type="button" onClick={() => authModal.open("signin")} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-[#14181F] hover:brightness-110">
          Sign in
        </button>
      </div>
    );
  }

  const upload = async (file?: File) => {
    if (!file) return;
    setError("");
    if (!UPLOAD_TYPES.includes(file.type)) return setError("Please choose a JPG, PNG or WebP image.");
    if (file.size > MAX_BYTES) return setError("That image is too large. Please choose one under 15 MB.");
    setBusy(true);
    try {
      const url = await saveSiteImage(await prepareImage(file));
      addRecent(url);
      onPick(uploadedImageValue(url, as));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setBusy(false);
    }
  };

  const currentUrl = isUploadedImage(current) ? uploadedImageUrl(current) : null;

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void upload(e.dataTransfer.files[0]);
        }}
        className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition ${over ? "border-brand bg-brand/10" : "border-line hover:border-brand/60"} disabled:opacity-60`}
      >
        {busy ? <Loader2 size={28} className="animate-spin text-muted" /> : <UploadCloud size={28} className="text-muted" />}
        <span className="font-semibold text-ink">{busy ? "Uploading…" : "Choose a photo or drop it here"}</span>
        <span className="text-xs text-muted">JPG, PNG or WebP. Big photos are shrunk automatically.</span>
      </button>
      <input ref={fileRef} type="file" accept={UPLOAD_TYPES.join(",")} hidden onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} />


      {error && <p role="alert" className="text-sm text-error">{error}</p>}

      {recents.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Your recent uploads</p>
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {recents.map((url) => (
              <li key={url}>
                <button
                  type="button"
                  onClick={() => onPick(uploadedImageValue(url, as))}
                  aria-label="Use this uploaded picture"
                  className={`block w-full overflow-hidden rounded-lg border-2 transition ${url === currentUrl ? "border-brand" : "border-transparent hover:border-line"}`}
                >
                  <img src={url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
