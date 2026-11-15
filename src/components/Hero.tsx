import { ArrowRight, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import GenreTag from "./GenreTag";
import { genresOf, getHeroBooks } from "../data/allBooks";
import { useRemoteVersion } from "../data/remote";

const SLIDE_MS = 5000;
const MAX_SLIDES = 10;

interface SlideData {
  slug: string;
  genre?: string;
  title: string;
  blurb: string;
  cover: string;
}

function SlideView({ s, anim, hidden }: { s: SlideData; anim: string; hidden?: boolean }) {
  return (
    <div className={`hero-slide relative [grid-area:1/1] overflow-hidden ${hidden ? "pointer-events-none" : ""} ${anim}`} aria-hidden={hidden || undefined}>
      {/* Background art */}
      <img src={s.cover} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover object-[50%_75%] opacity-60 blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent" />

      <div className="relative flex min-h-[19rem] items-center justify-between gap-6 p-6 pb-10 sm:p-8 sm:pb-10 lg:min-h-[22rem]">
        <div className="hero-rise max-w-md">
          {s.genre && <GenreTag name={s.genre} className="inline-block rounded-full border border-brand/60 bg-brand/20 px-3 py-1 text-xs font-medium text-ink" />}
          <h1 className="mt-4 line-clamp-2 font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl">{s.title}</h1>
          <p className="mt-3 line-clamp-3 text-sm text-muted sm:text-base">{s.blurb}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/books/${s.slug}`}
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
          className="hero-cover hidden h-56 w-auto rounded-lg border border-white/10 object-cover shadow-2xl shadow-black/50 md:block lg:h-64"
        />
      </div>
    </div>
  );
}

export default function Hero() {
  const version = useRemoteVersion(); // rebuild the slides when books load from the database
  const [view, setView] = useState<{ i: number; prev: number | null; dir: 1 | -1 }>({ i: 0, prev: null, dir: 1 });
  const { i, prev, dir } = view;
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  // Up to 10 of the hottest listed books that have a description. No books yet -> welcome banner.
  const slides = useMemo(
    () => getHeroBooks(MAX_SLIDES).map((b) => ({ slug: b.slug, genre: genresOf(b)[0], title: b.title, blurb: b.description!, cover: b.cover })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );
  const count = slides.length;
  const s = slides[i % Math.max(count, 1)];
  const leaving = prev !== null ? slides[prev % Math.max(count, 1)] : undefined;

  // Move on every 5 seconds and loop back to the first book. Pauses on hover, focus or touch, and while the tab is hidden.
  // People who ask their device for less motion get no auto-advance (they can still use the arrows and dots).
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setView((v) => ({ i: (v.i + 1) % count, prev: v.i, dir: 1 }));
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [count, paused, i]); // `i` restarts the timer after a manual change, so a slide never flashes by

  /** Slide to book `n`. dir 1 = the new slide comes in from the right, -1 = from the left. */
  const go = (n: number, d: 1 | -1 = 1) => {
    const target = ((n % count) + count) % count;
    if (target !== i) setView({ i: target, prev: i, dir: d });
  };

  // Once the slide-out has finished, stop drawing the old slide.
  useEffect(() => {
    if (prev === null) return;
    const id = window.setTimeout(() => setView((v) => ({ ...v, prev: null })), 800);
    return () => window.clearTimeout(id);
  }, [prev, i]);

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
    <section
      className="relative overflow-hidden rounded-2xl border border-line bg-surface"
      aria-roledescription="carousel"
      aria-label="Featured books"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        setPaused(true);
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        if (touchX.current !== null && Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        touchX.current = null;
        setPaused(false);
      }}
    >
      {/* The current slide and, while it is sliding out, the previous one share one grid cell. */}
      <div className="grid">
        {leaving && <SlideView s={leaving} anim={`hero-out-${dir > 0 ? "next" : "prev"}`} hidden />}
        <SlideView s={s} anim={leaving ? `hero-in-${dir > 0 ? "next" : "prev"}` : ""} />
      </div>

      {count > 1 && <>
      <button
        onClick={() => go(i + 1)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:block md:right-3 lg:hidden"
      >
        <ChevronRight size={18} />
      </button>
      <button
        onClick={() => go(i + 1)}
        aria-label="Next slide"
        className="absolute right-4 top-4 hidden rounded-full bg-black/50 p-2 text-white hover:bg-black/70 lg:block"
      >
        <ChevronRight size={18} />
      </button>

      <div className="absolute bottom-4 left-6 flex gap-1.5 sm:left-8">
        {slides.map((sl, idx) => (
          <button
            key={sl.slug}
            onClick={() => go(idx, idx > i % count ? 1 : -1)}
            aria-label={`Go to slide ${idx + 1}: ${sl.title}`}
            aria-current={idx === i % count}
            className={`h-1.5 rounded-full transition-all ${idx === i % count ? "w-4 bg-brand" : "w-1.5 bg-muted/60"}`}
          />
        ))}
      </div>
      </>}
    </section>
  );
}
