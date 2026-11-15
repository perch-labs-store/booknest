import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Book } from "../data/books";
import BookCard from "./BookCard";

interface Props {
  title: string;
  books: Book[];
  to?: string;
  /** Show placeholder cards while the books are still arriving. */
  loading?: boolean;
}

export default function BookSection({ title, books, to = "/new-releases", loading = false }: Props) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-ink">{title}</h2>
        <Link to={to} className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
          View All <ArrowRight size={14} />
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5" aria-busy="true" aria-label={`Loading ${title}`}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`animate-pulse ${i > 1 ? "hidden sm:block" : ""} ${i > 2 ? "sm:hidden md:block" : ""}`}>
              <div className="aspect-[3/4] rounded-xl border border-line bg-surface" />
              <div className="mt-2.5 h-3.5 w-3/4 rounded bg-surface" />
              <div className="mt-2 h-3 w-1/2 rounded bg-surface" />
            </div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="font-semibold text-ink">No books yet</p>
          <p className="mt-1 text-sm text-muted">Books added by authors will show up here.</p>
        </div>
      )}
    </section>
  );
}
