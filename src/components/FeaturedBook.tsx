import { useState } from "react";
import { Link } from "react-router-dom";
import { Pin, ShoppingCart, Star } from "lucide-react";
import BuyModal from "./BuyModal";
import { bookSlug } from "../data/allBooks";
import { activeDiscount } from "../data/discount";
import type { CatalogBook } from "../data/catalog";

/** The book an author pinned to the top of their page: big cover, blurb, rating and a Buy button. */
export default function FeaturedBook({ book, onUnpin }: { book: CatalogBook; onUnpin?: () => void }) {
  const [buying, setBuying] = useState(false);
  const discount = activeDiscount(book.discount);
  const links = book.links ?? [];
  return (
    <section aria-label="Featured book" className="mb-6 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-accent">
        <span className="flex items-center gap-1.5"><Pin size={13} /> Featured book</span>
        {onUnpin && <button onClick={onUnpin} className="font-medium normal-case tracking-normal text-muted hover:text-ink">Unpin</button>}
      </div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row">
        <Link to={`/books/${bookSlug(book.title)}`} className="relative mx-auto block w-36 shrink-0 sm:mx-0 sm:w-40">
          {discount && <span className="absolute left-2 top-2 z-10 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">{discount.percent}% off</span>}
          <img src={book.cover} alt={`${book.title} cover`} className="aspect-[3/4] w-full rounded-xl border border-line object-cover shadow-md" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/books/${bookSlug(book.title)}`} className="font-serif text-2xl font-bold text-ink hover:underline">{book.title}</Link>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {book.ratingCount > 0 && (
              <span className="flex items-center gap-1 font-medium text-ink"><Star size={13} className="fill-brand text-brand" /> {book.rating.toFixed(1)} <span className="font-normal text-muted">({book.ratingCount.toLocaleString("en-US")})</span></span>
            )}
            {book.genres.join(" · ")}
          </p>
          {book.description && <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-ink/90">{book.description}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            {links.length > 0 && (
              <button onClick={() => setBuying(true)} className="flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-[#14181F] hover:brightness-110">
                <ShoppingCart size={15} /> Buy
              </button>
            )}
            <Link to={`/books/${bookSlug(book.title)}`} className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-brand/10">View book</Link>
          </div>
        </div>
      </div>
      {buying && <BuyModal title={book.title} links={links} discount={discount} onClose={() => setBuying(false)} />}
    </section>
  );
}
