import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, X } from "lucide-react";
import { IMAGE_LIBRARY, imageKind, imageSrc, type ImageKind } from "../data/templates";

interface Props {
  value: string | undefined;
  onChange: (id: string) => void;
  editable: boolean;
  /** Wrapper classes: set the size/shape here (the image fills it). */
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/** An image from the cover / portrait library. In edit mode, click it to swap. */
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
  const [tab, setTab] = useState<ImageKind>(kind);

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
        aria-label="Choose an image"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-line bg-surface text-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line p-3">
          <div className="flex gap-1 rounded-lg border border-line p-1">
            {(["cover", "author"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${tab === k ? "bg-brand/25 text-ink" : "text-muted hover:text-ink"}`}
              >
                {k === "cover" ? "Book covers" : "Author photos"}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto rounded-md p-1.5 text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <ul className={`grid gap-3 overflow-y-auto p-4 ${tab === "cover" ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-3 sm:grid-cols-4"}`}>
          {IMAGE_LIBRARY[tab].map((img) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => onPick(img.id)}
                className={`block w-full overflow-hidden rounded-lg border-2 text-left transition ${
                  img.id === current ? "border-brand" : "border-transparent hover:border-line"
                }`}
              >
                <img src={imageSrc(img.id)} alt={img.label} className={`w-full object-cover ${tab === "cover" ? "aspect-[3/4]" : "aspect-square"}`} />
                <span className="block truncate px-1 py-1 text-[11px] text-muted">{img.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
