import { ArrowRight, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import GenreTag from "./GenreTag";
import { bookSlug, genresOf, getAllBooks } from "../data/allBooks";

export default function Hero() {
  const [i, setI] = useState(0);

  // Feature up to three listed books that have a description. No books yet -> welcome banner.
  const slides = useMemo(
    () =>
      getAllBooks()
        .filter((b) => !b.draft && (b.daysAgo ?? 0) >= 0 && b.description)
        .slice(0, 3)
        .map((b) => ({ genre: genresOf(b)[0], title: b.title, blurb: b.description!, cover: b.cover })),
    []
  );
  const s = slides[i];

  if (!s) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-orange-500/25 via-rose-800/25 to-indigo-950/40 p-6 sm:p-10">
        <div className="max-w-lg">
          <h1 className="font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl">Welcome to BookNest</h1>
          <p className="mt-3 text-sm text-muted sm:text-base">
            A home for authors and book lovers. No books have been listed yet. Be the first to add yours.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/add-book"
              className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-[#14181F] transition hover:brightness-110"
            >
              Add a Book <ArrowRight size={16} />
            </Link>
            <Link
              to="/genres"
              className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand/10"
            >
              Browse Genres
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-surface">
      {/* Background art */}
      <img
        src={s.cover}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover object-[50%_75%] opacity-60 blur-[2px]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent" />

      <div className="relative flex items-center justify-between gap-6 p-6 sm:p-8">
        <div className="max-w-md">
          {s.genre && <GenreTag name={s.genre} className="inline-block rounded-full border border-brand/60 bg-brand/20 px-3 py-1 text-xs font-medium text-ink" />}
          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl">{s.title}</h1>
          <p className="mt-3 text-sm text-muted sm:text-base">{s.blurb}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/books/${bookSlug(s.title)}`}
              className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-[#14181F] transition hover:brightness-110"
            >
              View Details <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Cover art */}
        <img
          src={s.cover}
          alt={`${s.title} cover`}
          className="hidden h-56 w-auto rounded-lg border border-white/10 object-cover shadow-2xl shadow-black/50 md:block lg:h-64"
        />
      </div>

      {slides.length > 1 && <>
      <button
        onClick={() => setI((i + 1) % slides.length)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:block md:right-3 lg:hidden"
      >
        <ChevronRight size={18} />
      </button>
      <button
        onClick={() => setI((i + 1) % slides.length)}
        aria-label="Next slide"
        className="absolute right-4 top-4 hidden rounded-full bg-black/50 p-2 text-white hover:bg-black/70 lg:block"
      >
        <ChevronRight size={18} />
      </button>

      <div className="absolute bottom-4 left-6 flex gap-1.5 sm:left-8">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-4 bg-brand" : "w-1.5 bg-muted/60"}`}
          />
        ))}
      </div>
      </>}
    </section>
  );
}
