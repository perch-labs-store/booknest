import { catalog } from "./catalog";
import { trendingBooks, recommendedBooks } from "./books";
import { releases } from "./releases";
import { initialMyBooks, initialProfile } from "./profile";
import { authorIdForName, getAuthorByName } from "./authorBooks";
import { compact } from "../utils/format";
import type { Book } from "./books";
import type { BookLink } from "./links";
import type { Discount } from "./discount";

/** One book, merged from every existing data source. Fields are optional when no source has them. */
export interface BookDetail {
  slug: string;
  /** Database id, for books saved in Supabase. */
  id?: number;
  title: string;
  author: string;
  cover: string;
  description?: string;
  genres?: string[];
  formats?: string[];
  rating?: number;
  ratingCount?: number;
  likes?: number;
  saves?: number;
  /** Days since release (negative = upcoming). Only known for books in the releases data. */
  daysAgo?: number;
  /** Where to buy it (printed copy, eBook, audiobook), added by the author. */
  links?: BookLink[];
  /** Discount the author is running, if any. */
  discount?: Discount;
  draft?: boolean;
}

export const bookSlug = (title: string) =>
  title.toLowerCase().replace(/['’]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Same slug rules for genres, e.g. "Sci-Fi" -> "sci-fi", "Young Adult" -> "young-adult". */
export const genreSlug = bookSlug;

const parseCount = (v: string) => {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return undefined;
  return /K$/i.test(v) ? Math.round(n * 1000) : /M$/i.test(v) ? Math.round(n * 1_000_000) : n;
};

let cache: Map<string, BookDetail> | null = null;

function build() {
  const out = new Map<string, BookDetail>();
  const add = (b: Omit<BookDetail, "slug">) => {
    const slug = bookSlug(b.title);
    const prev = out.get(slug);
    if (!prev) return void out.set(slug, { slug, ...b });
    // Earlier sources win; later ones only fill in fields that are still missing.
    const merged: Record<string, unknown> = { ...prev };
    for (const [f, v] of Object.entries(b)) if (v !== undefined && merged[f] === undefined) merged[f] = v;
    out.set(slug, merged as unknown as BookDetail);
  };

  catalog.forEach((b) => add({ id: b.id, title: b.title, author: b.author, cover: b.cover, description: b.description, genres: b.genres, formats: b.formats, rating: b.rating, ratingCount: b.ratingCount, likes: b.likes, saves: b.saves, links: b.links, discount: b.discount }));
  releases.forEach((b) => add({ id: b.id, title: b.title, author: b.author, cover: b.cover, likes: parseCount(b.likes), saves: parseCount(b.saves), daysAgo: b.daysAgo, discount: b.discount }));
  [...trendingBooks, ...recommendedBooks].forEach((b) => add({ title: b.title, author: b.author, cover: b.cover, likes: parseCount(b.likes), saves: parseCount(b.saves), discount: b.discount }));
  initialMyBooks.forEach((b) =>
    add({ id: b.id, title: b.title, author: initialProfile.name, cover: b.cover, likes: b.likes || undefined, saves: b.saves || undefined, draft: b.status === "Draft", links: b.links, discount: b.discount })
  );
  return out;
}

const all = () => (cache ??= build());

/** Forget the merged book list so it is rebuilt from the latest data (after loading from the database). */
export const resetBookCache = () => {
  cache = null;
};

export const getBookBySlug = (slug?: string) => (slug ? all().get(slug) : undefined);
export const getBookByTitle = (title: string) => all().get(bookSlug(title));

/** Genre tags: the book's own, or the genres already listed on its author. */
export function genresOf(book: BookDetail): string[] {
  if (book.genres?.length) return book.genres;
  return getAuthorByName(book.author)?.genres.split(" · ").slice(0, 3) ?? [];
}

/** Other books sharing a genre; falls back to the same author's other books. */
export function getSimilarBooks(book: BookDetail, limit = 5): BookDetail[] {
  const mine = genresOf(book).map((g) => g.toLowerCase());
  const others = [...all().values()].filter((b) => b.slug !== book.slug && !b.draft && (b.daysAgo ?? 0) >= 0);
  const score = (b: BookDetail) => genresOf(b).filter((g) => mine.includes(g.toLowerCase())).length;
  const similar = others
    .map((b) => ({ b, s: score(b) + (b.author === book.author ? 0.5 : 0) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || (y.b.rating ?? 0) - (x.b.rating ?? 0) || (y.b.likes ?? 0) - (x.b.likes ?? 0));
  return similar.slice(0, limit).map((x) => x.b);
}

export const getAllBooks = () => [...all().values()];

/** Canonical genre name for a slug, if any book (or author) in the data uses that genre. */
export function getGenreName(slug?: string): string | undefined {
  if (!slug) return undefined;
  for (const b of all().values()) {
    const hit = genresOf(b).find((g) => genreSlug(g) === slug);
    if (hit) return hit;
  }
  return undefined;
}

/** Every listed (non-draft) book in a genre, most liked first. */
export function getBooksByGenre(name: string): BookDetail[] {
  const target = name.toLowerCase();
  return getAllBooks()
    .filter((b) => !b.draft && genresOf(b).some((g) => g.toLowerCase() === target))
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0) || (b.rating ?? 0) - (a.rating ?? 0));
}

/* ------------------------------------------------------------------ */
/* Home page: Trending, Recommended and the Hero slider               */
/* ------------------------------------------------------------------ */

const released = (b: BookDetail) => !b.draft && (b.daysAgo ?? 0) >= 0 && Boolean(b.cover);
const popularity = (b: BookDetail) => (b.likes ?? 0) + 2 * (b.saves ?? 0);
/** Likes and saves, plus a small boost for books released in the last two weeks. */
const trendScore = (b: BookDetail) => popularity(b) + Math.max(0, 14 - (b.daysAgo ?? 14)) * 5;
const newestFirst = (a: BookDetail, b: BookDetail) => (a.daysAgo ?? 9999) - (b.daysAgo ?? 9999) || a.title.localeCompare(b.title);

/** Shape a book for BookCard. */
export const toCard = (b: BookDetail, i = 0): Book => ({
  id: b.id ?? -(i + 1),
  title: b.title,
  author: b.author,
  cover: b.cover,
  likes: compact(b.likes ?? 0),
  saves: compact(b.saves ?? 0),
  discount: b.discount,
});

/** Released books, hottest first. With few likes yet, the newest books come first. */
export function getTrendingBooks(limit = 10): BookDetail[] {
  return getAllBooks()
    .filter(released)
    .sort((a, b) => trendScore(b) - trendScore(a) || newestFirst(a, b))
    .slice(0, limit);
}

/** Books for the Hero slider: the trending order, but only books with a description to show. */
export const getHeroBooks = (limit = 10): BookDetail[] => getTrendingBooks(1000).filter((b) => b.description).slice(0, limit);

export interface Taste {
  liked: Set<number>;
  saved: Set<number>;
  /** Author ids the person follows. */
  following: Set<string>;
}

/**
 * "Recommended for you". With some history (liked or saved books, followed authors) it ranks books by shared
 * genres and followed authors. With none, it shows a mix of well-rated books from different genres, preferring
 * ones that aren't in `avoid` (e.g. the Trending list).
 */
export function getRecommendedBooks(taste: Taste, limit = 10, avoid: Set<string> = new Set()): BookDetail[] {
  const pool = getAllBooks().filter(released);
  const mine = pool.filter((b) => b.id !== undefined && (taste.liked.has(b.id) || taste.saved.has(b.id)));
  const weights = new Map<string, number>();
  mine.forEach((b) => genresOf(b).forEach((g) => weights.set(g.toLowerCase(), (weights.get(g.toLowerCase()) ?? 0) + 1)));

  if (weights.size || taste.following.size) {
    const have = new Set(mine.map((b) => b.slug));
    const match = (b: BookDetail) =>
      genresOf(b).reduce((n, g) => n + (weights.get(g.toLowerCase()) ?? 0), 0) * 3 + (taste.following.has(authorIdForName(b.author) ?? "") ? 4 : 0);
    return pool
      .filter((b) => !have.has(b.slug))
      .map((b) => ({ b, s: match(b) }))
      .sort((x, y) => y.s - x.s || popularity(y.b) - popularity(x.b) || newestFirst(x.b, y.b))
      .slice(0, limit)
      .map((x) => x.b);
  }

  // No history: one book per genre in turn, best rated first.
  const byQuality = (a: BookDetail, b: BookDetail) => (b.rating ?? 0) - (a.rating ?? 0) || popularity(b) - popularity(a) || newestFirst(a, b);
  const fresh = pool.filter((b) => !avoid.has(b.slug)).sort(byQuality);
  const rest = pool.filter((b) => avoid.has(b.slug)).sort(byQuality);
  const buckets = new Map<string, BookDetail[]>();
  fresh.forEach((b) => {
    const key = (genresOf(b)[0] ?? "other").toLowerCase();
    buckets.set(key, [...(buckets.get(key) ?? []), b]);
  });
  const out: BookDetail[] = [];
  while (out.length < limit && [...buckets.values()].some((l) => l.length)) {
    for (const list of buckets.values()) {
      const next = list.shift();
      if (next && out.length < limit) out.push(next);
    }
  }
  return [...out, ...rest].slice(0, limit);
}
