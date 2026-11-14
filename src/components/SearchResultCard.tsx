import { Bookmark, Heart, Star } from "lucide-react";
import type { CatalogBook } from "../data/catalog";
import { Link } from "react-router-dom";
import { bookSlug } from "../data/allBooks";
import { activeDiscount } from "../data/discount";
import AuthorLink from "./AuthorLink";
import GenreTag from "./GenreTag";
import { compact } from "../utils/format";

export default function SearchResultCard({ book }: { book: CatalogBook }) {
  const discount = activeDiscount(book.discount);
  return (
    <article className="flex gap-4 rounded-2xl border border-line bg-surface p-3 transition hover:border-brand/50">
      <Link to={`/books/${bookSlug(book.title)}`} className="shrink-0" aria-label={`View ${book.title}`}>
        <img
          src={book.cover}
          alt={`${book.title} cover`}
          loading="lazy"
          className="h-28 w-[76px] rounded-lg object-cover sm:h-[120px] sm:w-[84px]"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="truncate font-serif text-lg font-bold text-ink">
            <Link to={`/books/${bookSlug(book.title)}`} className="hover:text-accent">{book.title}</Link>
          </h3>
          <p className="text-xs text-muted">By <AuthorLink name={book.author} /></p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {discount && (
              <span className="rounded-md bg-success px-2 py-0.5 text-[11px] font-semibold text-white">{discount.percent}% off</span>
            )}
            {book.genres.slice(0, 2).map((g) => (
              <GenreTag key={g} name={g} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-ink/90" />
            ))}
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-xs text-muted">{book.description}</p>
      </div>

      <div className="hidden shrink-0 flex-col items-end justify-between text-xs text-muted sm:flex">
        <div className="space-y-1.5 text-right">
          <p className="flex items-center justify-end gap-1.5">
            <Heart size={14} /> {compact(book.likes)}
          </p>
          <p className="flex items-center justify-end gap-1.5">
            <Bookmark size={14} /> {compact(book.saves)}
          </p>
        </div>
        <p className="flex items-center gap-1 font-medium text-ink">
          <Star size={14} className="fill-brand text-brand" /> {book.rating.toFixed(1)}
          <span className="font-normal text-muted">({compact(book.ratingCount)})</span>
        </p>
      </div>
    </article>
  );
}
