import { authorOfTheMonth, authors, type Author } from "./authors";
import { catalog } from "./catalog";
import { trendingBooks, recommendedBooks } from "./books";
import { releases } from "./releases";
import type { Discount } from "./discount";

/** A book shown on an author page, merged from every existing data source. */
export interface AuthorBook {
  key: string;
  title: string;
  cover: string;
  /** Only present when the catalog has a rating for the book. */
  rating?: number;
  ratingCount?: number;
  likes?: number;
  saves?: number;
  discount?: Discount;
  genres?: string[];
  description?: string;
  /** Days since release (negative = upcoming). Only known for books in the releases data. */
  daysAgo?: number;
}

// Read live: `authors` is filled from Supabase after this module loads, so a snapshot taken here would stay empty.
const allAuthors = (): Author[] => [...(authorOfTheMonth ? [authorOfTheMonth] : []), ...authors];

export const getAuthorById = (id?: string) => allAuthors().find((a) => a.id === id);

export const getAuthorByName = (name: string) => allAuthors().find((a) => a.name.toLowerCase() === name.toLowerCase());

/** Id of the author page for a given name, or undefined if that name isn't an author in the app. */
export const authorIdForName = (name: string) => getAuthorByName(name)?.id;

const parse = (v: string) => {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return undefined;
  return /K$/i.test(v) ? Math.round(n * 1000) : /M$/i.test(v) ? Math.round(n * 1_000_000) : n;
};

export function getBooksByAuthor(author: Author): AuthorBook[] {
  const out = new Map<string, AuthorBook>();
  const same = (n: string) => n.toLowerCase() === author.name.toLowerCase();
  const mine = (b: { authorId?: string; author: string }) => (b.authorId ? b.authorId === author.id : same(b.author));
  const add = (b: AuthorBook) => {
    const k = b.title.toLowerCase();
    const prev = out.get(k);
    if (!prev) return void out.set(k, b);
    // Earlier sources win; later ones only fill in fields that are still missing.
    const merged: Record<string, unknown> = { ...prev };
    for (const [f, v] of Object.entries(b)) if (v !== undefined && merged[f] === undefined) merged[f] = v;
    out.set(k, merged as unknown as AuthorBook);
  };

  catalog.filter(mine).forEach((b) =>
    add({ key: `c${b.id}`, title: b.title, cover: b.cover, rating: b.rating, ratingCount: b.ratingCount, likes: b.likes, saves: b.saves, discount: b.discount, genres: b.genres, description: b.description })
  );
  releases.filter(mine).forEach((b) =>
    add({ key: `r${b.id}`, title: b.title, cover: b.cover, likes: parse(b.likes), saves: parse(b.saves), daysAgo: b.daysAgo, discount: b.discount })
  );
  [...trendingBooks, ...recommendedBooks].filter((b) => same(b.author)).forEach((b) =>
    add({ key: `b${b.id}`, title: b.title, cover: b.cover, likes: parse(b.likes), saves: parse(b.saves), discount: b.discount })
  );

  // Best-rated / most-liked first; upcoming releases last.
  return [...out.values()].sort((a, b) => {
    const up = Number((a.daysAgo ?? 0) < 0) - Number((b.daysAgo ?? 0) < 0);
    if (up) return up;
    return (b.rating ?? 0) - (a.rating ?? 0) || (b.likes ?? 0) - (a.likes ?? 0);
  });
}
