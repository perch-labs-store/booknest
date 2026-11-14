import { catalog } from "./catalog";
import { trendingBooks, recommendedBooks } from "./books";
import { releases } from "./releases";
import { initialMyBooks, initialProfile } from "./profile";
import { getAuthorByName } from "./authorBooks";
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
