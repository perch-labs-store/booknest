import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, SearchX, SlidersHorizontal } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Tabs from "../components/Tabs";
import SearchField from "../components/SearchField";
import FilterPanel, { type Filters } from "../components/FilterPanel";
import SearchResultCard from "../components/SearchResultCard";
import Avatar from "../components/Avatar";
import { catalog } from "../data/catalog";
import { authors } from "../data/authors";
import { genres } from "../data/genres";
import { getBooksByGenre } from "../data/allBooks";
import { compact } from "../utils/format";

const TABS = ["All", "Books", "Authors", "Genres"] as const;
type Tab = (typeof TABS)[number];

const EMPTY: Filters = { genres: [], formats: [], minRating: 0 };

export default function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [tab, setTab] = useState<Tab>("All");
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);

  const setQuery = (q: string) => setParams(q ? { q } : {}, { replace: true });
  const q = query.trim().toLowerCase();

  // Books matching the text query (before sidebar filters) — also used for facet counts.
  const queryBooks = useMemo(
    () =>
      catalog.filter(
        (b) =>
          !q ||
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.genres.some((g) => g.toLowerCase().includes(q))
      ),
    [q]
  );

  const books = useMemo(
    () =>
      queryBooks
        .filter((b) => !filters.genres.length || b.genres.some((g) => filters.genres.includes(g)))
        .filter((b) => !filters.formats.length || b.formats.some((f) => filters.formats.includes(f)))
        .filter((b) => b.rating >= filters.minRating)
        .sort((a, b) => b.likes - a.likes),
    [queryBooks, filters]
  );

  const genreCounts = useMemo(() => {
    const out: Record<string, number> = {};
    queryBooks.forEach((b) => b.genres.forEach((g) => (out[g] = (out[g] ?? 0) + 1)));
    return out;
  }, [queryBooks]);
  const formatCounts = useMemo(() => {
    const out: Record<string, number> = {};
    queryBooks.forEach((b) => b.formats.forEach((f) => (out[f] = (out[f] ?? 0) + 1)));
    return out;
  }, [queryBooks]);

  const matchedAuthors = useMemo(
    () => authors.filter((a) => !q || a.name.toLowerCase().includes(q) || a.genres.toLowerCase().includes(q)),
    [q]
  );
  const matchedGenres = useMemo(() => genres.filter((g) => !q || g.name.toLowerCase().includes(q)), [q]);

  const showBooks = tab === "All" || tab === "Books";
  const showAuthors = tab === "All" || tab === "Authors";
  const showGenres = tab === "All" || tab === "Genres";

  // Only show a section's results while that content type is in view.
  const total =
    (showBooks ? books.length : 0) +
    (tab === "Authors" || (tab === "All" && q) ? matchedAuthors.length : 0) +
    (tab === "Genres" || (tab === "All" && q) ? matchedGenres.length : 0);

  const activeFilters = filters.genres.length + filters.formats.length + (filters.minRating > 0 ? 1 : 0);

  return (
    <>
      <PageHeader title="Search" subtitle="Find books, authors and genres across Fablebook." />

      <SearchField value={query} onChange={setQuery} placeholder="Search books, authors, genres…" className="mb-4 !h-12 rounded-full" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <span className="text-sm text-muted" aria-live="polite">
            {total.toLocaleString()} {total === 1 ? "result" : "results"}
          </span>
          {showBooks && (
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink lg:hidden"
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={15} /> Filters{activeFilters > 0 && ` (${activeFilters})`}
            </button>
          )}
        </div>
      </div>

      <div className={`grid gap-5 ${showBooks ? "lg:grid-cols-[220px_1fr]" : ""}`}>
        {showBooks && (
          <div className={showFilters ? "block" : "hidden lg:block"}>
            <FilterPanel value={filters} onChange={setFilters} genreCounts={genreCounts} formatCounts={formatCounts} />
          </div>
        )}

        <div className="min-w-0 space-y-6">
          {showBooks && books.length > 0 && (
            <section className="space-y-3" aria-label="Books">
              {tab === "All" && q && <h2 className="text-sm font-semibold text-muted">Books</h2>}
              {books.map((b) => (
                <SearchResultCard key={b.id} book={b} />
              ))}
            </section>
          )}

          {showAuthors && q !== "" || tab === "Authors" ? (
            matchedAuthors.length > 0 && (
              <section className="space-y-3" aria-label="Authors">
                {tab === "All" && <h2 className="text-sm font-semibold text-muted">Authors</h2>}
                {matchedAuthors.slice(0, tab === "All" ? 3 : undefined).map((a) => (
                  <Link
                    key={a.id}
                    to={`/authors/${a.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-3 transition hover:border-brand/50"
                  >
                    <Avatar name={a.name} className="h-12 w-12 text-base" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{a.name}</p>
                      <p className="truncate text-xs text-muted">{a.genres}</p>
                    </div>
                    <p className="text-xs text-muted">
                      {compact(a.followers)} followers · {a.books} books
                    </p>
                    <ChevronRight size={16} className="text-muted" />
                  </Link>
                ))}
              </section>
            )
          ) : null}

          {(showGenres && q !== "") || tab === "Genres" ? (
            matchedGenres.length > 0 && (
              <section aria-label="Genres">
                {tab === "All" && <h2 className="mb-3 text-sm font-semibold text-muted">Genres</h2>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {matchedGenres.map((g) => (
                    <Link
                      key={g.slug}
                      to={`/genres/${g.slug}`}
                      className={`flex items-center gap-3 rounded-2xl bg-gradient-to-br p-4 text-white ${g.gradient}`}
                    >
                      <g.icon size={20} />
                      <div>
                        <p className="text-sm font-semibold">{g.name}</p>
                        <p className="text-xs text-white/75">{getBooksByGenre(g.name).length.toLocaleString()} books</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          ) : null}

          {total === 0 && (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <SearchX size={36} className="mb-3 text-muted" />
              <p className="font-semibold text-ink">No results{query && ` for “${query}”`}</p>
              <p className="mt-1 text-sm text-muted">Try a different keyword or clear some filters.</p>
              {activeFilters > 0 && (
                <button onClick={() => setFilters(EMPTY)} className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-[#14181F]">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
