import { useEffect, useRef, useState } from "react";
import { Bookmark, Heart, MoreHorizontal } from "lucide-react";
import type { ReadingItem, ReadingStatus } from "../data/readingList";

interface Props {
  item: ReadingItem;
  onToggleLike: () => void;
  onSetStatus: (s: ReadingStatus) => void;
  onRemove: () => void;
}

const STATUSES: ReadingStatus[] = ["Reading", "Want to Read", "Finished"];

export default function ReadingCard({ item, onToggleLike, onSetStatus, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <article className="rounded-xl">
      <div className="aspect-[3/4] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <img src={item.cover} alt={`${item.title} cover`} loading="lazy" className="h-full w-full object-cover" />
      </div>

      <h3 className="mt-2.5 truncate text-sm font-semibold text-ink">{item.title}</h3>
      <p className="truncate text-xs text-muted">{item.author}</p>

      {/* Progress */}
      <div className="mt-2.5 flex items-center gap-2">
        <div
          role="progressbar"
          aria-valuenow={item.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${item.title} reading progress`}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
        >
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${item.progress}%` }} />
        </div>
        <span className="w-8 text-right text-[11px] text-muted">{item.progress}%</span>
      </div>

      <div className="relative mt-2.5 flex items-center justify-between text-muted" ref={ref}>
        <button
          onClick={onToggleLike}
          aria-pressed={item.liked}
          aria-label={item.liked ? "Unlike" : "Like"}
          className={`rounded-md p-1 transition hover:text-ink ${item.liked ? "text-error" : ""}`}
        >
          <Heart size={16} className={item.liked ? "fill-current" : ""} />
        </button>
        <span className="rounded-md p-1 text-brand" title="In your reading list">
          <Bookmark size={16} className="fill-current" />
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`More options for ${item.title}`}
          className="rounded-md p-1 transition hover:text-ink"
        >
          <MoreHorizontal size={16} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute bottom-full right-0 z-20 mb-1 w-44 rounded-xl border border-line bg-surface p-1 shadow-xl"
          >
            {STATUSES.filter((s) => s !== item.status).map((s) => (
              <button
                key={s}
                role="menuitem"
                onClick={() => {
                  onSetStatus(s);
                  setOpen(false);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-ink hover:bg-brand/10"
              >
                Mark as {s}
              </button>
            ))}
            <button
              role="menuitem"
              onClick={onRemove}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs text-error hover:bg-error/10"
            >
              Remove from list
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
