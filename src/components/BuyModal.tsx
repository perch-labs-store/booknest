import { useEffect, useRef } from "react";
import { ExternalLink, Headphones, Package, Tablet, X, type LucideIcon } from "lucide-react";
import { FORMAT_LABELS, STORE_LABELS, sortLinks, type BookLink, type LinkFormat } from "../data/links";
import { formatEndDate, type Discount } from "../data/discount";

const ICONS: Record<LinkFormat, LucideIcon> = { printed: Package, ebook: Tablet, audiobook: Headphones };

interface Props {
  title: string;
  links: BookLink[];
  /** Pass only a discount that is still running. */
  discount?: Discount;
  onClose: () => void;
}

/** Lists everywhere the author sells the book (Amazon and other stores, by printed / eBook / audiobook). */
export default function BuyModal({ title, links, discount, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-title"
        className="relative max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <button ref={closeRef} onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-md p-1.5 text-muted hover:bg-brand/10 hover:text-ink">
          <X size={18} />
        </button>

        <h2 id="buy-title" className="pr-8 font-serif text-xl font-bold text-ink">Buy “{title}”</h2>
        <p className="mt-1 text-sm text-muted">Choose where you'd like to get it.</p>

        {discount && (
          <div className="mt-4 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
            <p className="font-semibold text-ink">{discount.percent}% off from the author</p>
            {(discount.endsOn || discount.code) && (
              <p className="mt-0.5 text-xs text-muted">
                {discount.endsOn && <>Offer ends {formatEndDate(discount.endsOn)}. </>}
                {discount.code && <>Use code <span className="font-semibold text-ink">{discount.code}</span> at checkout.</>}
              </p>
            )}
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {sortLinks(links).map((l) => {
            const Icon = ICONS[l.format];
            return (
              <li key={l.format + l.store + l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 rounded-xl border p-3 transition hover:bg-brand/15 ${l.store === "amazon" ? "border-brand" : "border-line"}`}
                >
                  <Icon size={20} className="shrink-0 text-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{FORMAT_LABELS[l.format]}</span>
                    <span className="block text-xs text-muted">on {STORE_LABELS[l.store]}</span>
                  </span>
                  <ExternalLink size={16} className="shrink-0 text-muted" />
                </a>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-xs text-muted">You'll leave Fablebook. Prices and availability are set by each store.</p>
      </div>
    </div>
  );
}
