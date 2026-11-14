import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookX, Tag } from "lucide-react";
import BookCard from "../components/BookCard";
import { getBooksByGenre, getGenreName } from "../data/allBooks";
import { genres } from "../data/genres";
import { compact } from "../utils/format";

const SORTS = ["Most Liked", "Top Rated", "A–Z"] as const;
type Sort = (typeof SORTS)[number];

export default function GenreDetail() {
  const { slug } = useParams();
  const [sort, setSort] = useState<Sort>("Most Liked");

  // A genre can come from the Genres page tiles or from tags on books/authors.
  const def = genres.find((g) => g.slug === slug);
  const name = def?.name ?? getGenreName(slug);

  const books = useMemo(() => {
    if (!name) return [];
    const list = getBooksByGenre(name);
    if (sort === "Top Rated") return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.likes ?? 0) - (a.likes ?? 0));
    if (sort === "A–Z") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [name, sort]);

  if (!name) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <BookX size={36} className="mb-3 text-muted" />
        <h1 className="font-serif text-2xl font-bold text-ink">Genre not found</h1>
        <Link to="/genres" className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-[#14181F]">Browse genres</Link>
      </div>
    );
  }

  const Icon = def?.icon ?? Tag;

  return (
    <>
      <Link to="/genres" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={15} /> Genres
      </Link>

      <header className={`relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-6 text-white sm:p-8 ${def?.gradient ?? "from-amber-500 via-rose-800 to-indigo-950"}`}>
        <Icon size={120} strokeWidth={1.2} className="absolute -right-4 -top-4 text-white/15" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="relative">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">{name}</h1>
          <p className="mt-1 text-sm text-white/80">{books.length} {books.length === 1 ? "book" : "books"}</p>
        </div>
      </header>

      {books.length > 0 ? (
        <>
          <div role="tablist" aria-label="Sort books" className="no-scrollbar mb-5 flex gap-1 overflow-x-auto">
            {SORTS.map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={s === sort}
                onClick={() => setSort(s)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  s === sort ? "border-b-2 border-brand bg-brand/20 text-ink" : "text-muted hover:bg-brand/10 hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {books.map((b, i) => (
              <BookCard
                key={b.slug}
                badge={(b.daysAgo ?? 0) < 0 ? "Upcoming" : undefined}
                book={{
                  id: i,
                  title: b.title,
                  author: b.author,
                  cover: b.cover,
                  likes: b.likes !== undefined ? compact(b.likes) : "—",
                  saves: b.saves !== undefined ? compact(b.saves) : "—",
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <BookX size={36} className="mb-3 text-muted" />
          <p className="font-semibold text-ink">No {name} books yet</p>
          <p className="mt-1 text-sm text-muted">Books added in this genre will show up here.</p>
          <Link to="/search" className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-[#14181F]">Search all books</Link>
        </div>
      )}
    </>
  );
}
