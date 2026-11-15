import { Bookmark, Heart } from "lucide-react";
import type { Book } from "../data/books";
import { Link } from "react-router-dom";
import { bookSlug } from "../data/allBooks";
import { activeDiscount } from "../data/discount";
import AuthorLink from "./AuthorLink";

interface Props {
  book: Book;
  badge?: string;
  /** Replaces the likes/saves row (e.g. an upcoming release date). */
  note?: string;
}

export default function BookCard({ book, badge, note }: Props) {
  const discount = activeDiscount(book.discount);
  return (
    <article className="group">
      <Link to={`/books/${bookSlug(book.title)}`} className="block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        {discount && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">
            {discount.percent}% off
          </span>
        )}
        {badge && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-[#14181F] shadow">
            {badge}
          </span>
        )}
        <img
          src={book.cover}
          alt={`${book.title} cover`}
          loading="lazy"
          decoding="async"
          width={300}
          height={400}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <h3 className="mt-2.5 truncate text-sm font-semibold text-ink group-hover:text-accent">{book.title}</h3>
      </Link>
      <p className="truncate text-xs text-muted"><AuthorLink name={book.author} /></p>
      {note ? (
        <p className="mt-2 text-xs font-medium text-accent">{note}</p>
      ) : (
        <div className="mt-2 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1"><Heart size={13} /> {book.likes}</span>
          <span className="flex items-center gap-1"><Bookmark size={13} /> {book.saves}</span>
        </div>
      )}
    </article>
  );
}
