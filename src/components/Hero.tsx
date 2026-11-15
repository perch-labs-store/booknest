import { ArrowRight, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import GenreTag from "./GenreTag";
import { genresOf, getHeroBooks } from "../data/allBooks";
import { isRemoteReady, useRemoteVersion } from "../data/remote";

const SLIDE_MS = 5000;
const MAX_SLIDES = 10;

interface SlideData {
  slug: string;
  genre?: string;
  title: string;
  blurb: string;
  cover: string;
}

/** Resolves when the picture is cached (or failed, or 2.5s passed), so a slide never slides in with an empty cover. */
const preload = (src: string) =>
  new Promise<void>((done) => {
    const img = new Image();
    img.onload = img.onerror = () => done();
    img.src = src;
    window.setTimeout(done, 2500);
  });

function SlideView({ s, anim, hidden, first }: { s: SlideData; anim: string; hidden?: boolean; first?: boolean }) {
  return (
    <div className={`hero-slide relative [grid-area:1/1] overflow-hidden ${hidden ? "pointer-events-none" : ""} ${anim}`} aria-hidden={hidden || undefined}>
      {/* Background art */}
      <img src={s.cover} alt="" decoding="async" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="absolute inset-0 h-full w-full scale-110 object-cover object-[50%_75%] opacity-50 blur-[3px] sm:opacity-60 sm:blur-[2px]" />
      {/* Darker on phones, where text and cover share a narrow row. */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg to-transparent" />
      <div className="absolute inset-0 bg-bg opacity-30 sm:opacity-0" />

      <div className="relative flex min-h-[15.5rem] items-center justify-between gap-4 px-5 pb-12 pt-6 sm:min-h-[19rem] sm:gap-6 sm:p-8 sm:pb-10 lg:min-h-[22rem]">
        <div className="hero-rise min-w-0 max-w-md flex-1 md:flex-none">
          {s.genre && <GenreTag name={s.genre} className="inline-block rounded-full border border-brand/60 bg-brand/20 px-2.5 py-0.5 text-[11px] font-medium text-ink sm:px-3 sm:py-1 sm:text-xs" />}
          <h1 className="mt-3 line-clamp-3 font-serif text-[1.6rem] font-bold leading-[1.15] text-ink sm:mt-4 sm:line-clamp-2 sm:text-4xl sm:leading-tight">{s.title}</h1>
          <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-muted sm:mt-3 sm:line-clamp-3 sm:text-base sm:leading-normal">{s.blurb}</p>
          <div className="mt-4 flex flex-wrap gap-3 sm:mt-6">
            <Link
              to={`/books/${s.slug}`}
              className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-[#14181F] transition hover:brightness-110 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              View Details <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Cover art: smaller on phones, but always shown */}
        <img
          src={s.cover}
          alt={`${s.title} cover`}
          width={192}
          height={256}
          decoding="async"
          {...(first ? { fetchPriority: "high" as const } : {})}
          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
          className="hero-cover aspect-[3/4] h-[8.75rem] w-auto shrink-0 rounded-lg border border-white/10 object-cover shadow-xl shadow-black/50 min-[400px]:h-40 sm:h-48 md:h-56 md:shadow-2xl lg:h-64"
        />
      </div>
    </div>
  );
}

export default function Hero() {
  const version = useRemoteVersion(); // rebuild the slides when books load from the database
  const [view, setView] = useState<{ i: number; prev: number | null; dir: 1 | -1 }>({ i: 0, prev: null, dir: 1 });
  const { i, prev, dir } = view;
  // Hover (mouse only), keyboard focus and an active touch each pause the slider. They are tracked separately so a tap
  // on a phone (which fakes a mouse-enter that never gets a mouse-leave) can't leave it paused forever.
  const [pause, setPause] = useState({ hover: false, focus: false, touch: false });
  const paused = pause.hover || pause.focus || pause.touch;
  const setP = (k: "hover" | "focus" | "touch", v: boolean) => setPause((p) => (p[k] === v ? p : { ...p, [k]: v }));
  const touchX = useRef<number | null>(null);

  // Up to 10 of the hottest listed books that have a description. No books yet -> welcome banner.
  const slides = useMemo(
    () => getHeroBooks(MAX_SLIDES).map((b) => ({ slug: b.slug, genre: genresOf(b)[0], title: b.title, blurb: b.description!, cover: b.cover })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );
  const count = slides.length;
  const cur = i % Math.max(count, 1);
  const s = slides[cur];
  const leaving = prev !== null ? slides[prev % Math.max(count, 1)] : undefined;

  // When the book list changes (quick load, full load, new like counts), stay on the same book if it is still listed,
  // otherwise go back to the first. Without this the position pointed at a different book, or past the end.
  const curSlug = useRef<string>();
  curSlug.current = s?.slug;
  const lastSlides = useRef(slides);
  useEffect(() => {
    if (lastSlides.current === slides) return;
    lastSlides.current = slides;
    const at = slides.findIndex((x) => x.slug === curSlug.current);
    setView({ i: Math.max(at, 0), prev: null, dir: 1 });
  }, [slides]);

  // Download the next few covers ahead of time, so slides come in with their picture already there (matters on slow networks).
  useEffect(() => {
    slides.slice(0, 4).forEach((x) => void preload(x.cover));
  }, [slides]);

  // Move on every 5 seconds and loop back to the first book. Pauses on hover, focus or touch, and while the tab is hidden.
  // The next slide waits (up to 2.5s) for its cover so it never slides in empty.
  // People who ask their device for less motion get no auto-advance (they can still use the arrows and dots).
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const id = window.setInterval(async () => {
      if (document.hidden) return;
      await preload(slides[(cur + 1) % count].cover);
      if (!cancelled) setView((v) => ({ i: (v.i + 1) % count, prev: v.i, dir: 1 }));
    }, SLIDE_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [count, paused, cur, slides]); // `cur` restarts the timer after a manual change, so a slide never flashes by

  /** Slide to book `n`. dir 1 = the new slide comes in from the right, -1 = from the left. */
  const go = (n: number, d: 1 | -1 = 1) => {
    const target = ((n % count) + count) % count;
    if (target !== cur) setView({ i: target, prev: cur, dir: d });
  };

  // Once the slide-out has finished, stop drawing the old slide.
  useEffect(() => {
    if (prev === null) return;
    const id = window.setTimeout(() => setView((v) => ({ ...v, prev: null })), 800);
    return () => window.clearTimeout(id);
  }, [prev, i]);

  if (!s && !isRemoteReady()) {
    return <div className="min-h-[19rem] animate-pulse rounded-2xl border border-line bg-surface lg:min-h-[22rem]" aria-busy="true" aria-label="Loading featured books" />;
  }

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
      className="relative touch-pan-y overflow-hidden rounded-2xl border border-line bg-surface"
      aria-roledescription="carousel"
      aria-label="Featured books"
      onPointerEnter={(e) => e.pointerType === "mouse" && setP("hover", true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setP("hover", false)}
      onFocus={(e) => setP("focus", e.target.matches(":focus-visible"))}
      onBlur={() => setP("focus", false)}
      onTouchStart={(e) => {
        setP("touch", true);
        touchX.current = e.touches[0].clientX;
      }}
      onTouchCancel={() => {
        touchX.current = null;
        setP("touch", false);
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        if (touchX.current !== null && Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        touchX.current = null;
        setP("touch", false);
      }}
    >
      {/* The current slide and, while it is sliding out, the previous one share one grid cell. */}
      <div className="grid">
        {leaving && <SlideView s={leaving} anim={`hero-out-${dir > 0 ? "next" : "prev"}`} hidden />}
        <SlideView s={s} first={cur === 0} anim={leaving ? `hero-in-${dir > 0 ? "next" : "prev"}` : ""} />
      </div>

      {count > 1 && <>
      <button
        onClick={() => go(cur + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-3 hidden rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:block lg:right-4 lg:top-4"
      >
        <ChevronRight size={18} />
      </button>

      <div className="absolute bottom-2 left-3 flex items-center sm:bottom-3 sm:left-6">
        {slides.map((sl, idx) => (
          <button
            key={sl.slug}
            onClick={() => go(idx, idx > cur ? 1 : -1)}
            aria-label={`Go to slide ${idx + 1}: ${sl.title}`}
            aria-current={idx === cur}
            className="group flex h-6 items-center px-[3px]"
          >
            <span className={`block h-1.5 rounded-full transition-all ${idx === cur ? "w-5 bg-brand" : "w-1.5 bg-ink opacity-30 group-hover:opacity-60"}`} />
          </button>
        ))}
      </div>
      </>}
    </section>
  );
}
