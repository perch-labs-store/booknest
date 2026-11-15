import { useSyncExternalStore } from "react";
import { supabase } from "../lib/supabase";
import { catalog, type CatalogBook, type Format } from "./catalog";
import { authors, type Author } from "./authors";
import { releases } from "./releases";
import { initialMyBooks, type MyBook, type Profile } from "./profile";
import type { AppNotification } from "./notifications";
import { bookSlug, genreSlug, resetBookCache } from "./allBooks";
import { normalizeUrl, type BookLink, type LinkFormat, type LinkStore } from "./links";
import type { Discount } from "./discount";
import type { SiteDoc } from "./templates";
import { SUBDOMAIN_RE } from "../lib/host";
import { prepareCover } from "../utils/image";

/* ------------------------------------------------------------------ */
/* Change notifications: pages re-render when the database data loads  */
/* ------------------------------------------------------------------ */

let version = 0;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
/** Changes every time books are (re)loaded from Supabase. */
export const useRemoteVersion = () => useSyncExternalStore(subscribe, () => version);

type ClerkGlobal = { user?: { id: string; fullName?: string | null; firstName?: string | null } | null };
const clerkUser = () => (window as unknown as { Clerk?: ClerkGlobal }).Clerk?.user ?? null;

/** Plain grey cover used when a book has no uploaded image. */
const NO_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="#2a2f3a"/><text x="150" y="235" font-family="Georgia,serif" font-size="22" fill="#8a93a6" text-anchor="middle">No cover</text></svg>`,
  );

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

interface BookRow {
  id: number;
  title: string;
  cover_url: string | null;
  description: string | null;
  formats: Format[] | null;
  status: "published" | "draft";
  release_date: string | null;
  discount_percent: number | null;
  discount_ends_on: string | null;
  discount_code: string | null;
  likes_count: number;
  saves_count: number;
  rating_avg: number;
  rating_count: number;
  created_by?: string | null;
  created_at: string;
  author: { id: string; name: string } | null;
  book_genres: { position: number; genres: { name: string } | null }[];
  book_links?: { type: string; format: LinkFormat; url: string }[];
}

interface AuthorRow {
  id: string;
  name: string;
  genres: string | null;
  bio: string | null;
  about: string | null;
  banner_url: string | null;
  featured_book_id: number | null;
  languages: string | null;
  followers_count: number;
  books_count: number;
  rating_avg: number;
  rating_count: number;
  verified: boolean;
  growth_pct: number;
  created_at: string;
}

const daysBetween = (iso: string) => Math.floor((Date.now() - new Date(`${iso.slice(0, 10)}T00:00:00`).getTime()) / 86_400_000);

const BOOK_COLS =
  "id, title, cover_url, description, formats, status, release_date, discount_percent, discount_ends_on, discount_code, likes_count, saves_count, rating_avg, rating_count, created_at, author:authors!author_id(id, name), book_genres(position, genres(name))";
/** How many of the most-liked books the quick (Home) load fetches. Enough for Trending, Recommended and the Hero. */
const QUICK_LIMIT = 40;
const CACHE_KEY = "booknest:home:v1";

/** True once the app has books to show (from the saved copy, the quick load or the full load) or loading has failed. */
let ready = !supabase;
/** True once the full catalog has been applied; a late quick result must not overwrite it. */
let fullLoaded = false;
let loadSeq = 0;
export const isRemoteReady = () => ready;

const notify = () => {
  version++;
  listeners.forEach((fn) => fn());
};

const discountOf = (r: BookRow): Discount | undefined =>
  r.discount_percent ? { percent: r.discount_percent, endsOn: r.discount_ends_on ?? undefined, code: r.discount_code ?? undefined } : undefined;
const linksOf = (r: BookRow): BookLink[] =>
  (r.book_links ?? []).map((l) => ({ format: l.format, store: (l.type === "amazon" ? "amazon" : "other") as LinkStore, url: l.url }));

/** Fills `catalog` and `releases` from published book rows. */
function applyPublished(published: BookRow[]) {
  catalog.splice(
    0,
    catalog.length,
    ...published.map<CatalogBook>((r) => ({
      id: r.id,
      title: r.title,
      author: r.author?.name ?? "Unknown author",
      authorId: r.author?.id,
      cover: r.cover_url || NO_COVER,
      description: r.description ?? "",
      genres: [...r.book_genres].sort((a, b) => a.position - b.position).map((g) => g.genres?.name).filter((n): n is string => !!n),
      formats: r.formats ?? [],
      rating: Number(r.rating_avg),
      ratingCount: r.rating_count,
      likes: r.likes_count,
      saves: r.saves_count,
      links: linksOf(r),
      discount: discountOf(r),
    })),
  );

  releases.splice(
    0,
    releases.length,
    ...published.map((r) => ({
      id: r.id,
      title: r.title,
      author: r.author?.name ?? "Unknown author",
      authorId: r.author?.id,
      cover: r.cover_url || NO_COVER,
      likes: String(r.likes_count),
      saves: String(r.saves_count),
      likeCount: r.likes_count,
      daysAgo: daysBetween(r.release_date ?? r.created_at),
      discount: discountOf(r),
    })),
  );
}

/** Saved copy of the last quick load, so a returning visitor sees books straight away (even offline or on a slow network). */
function readCache(): BookRow[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const rows = raw ? (JSON.parse(raw) as BookRow[]) : null;
    return Array.isArray(rows) && rows.length ? rows : null;
  } catch {
    return null;
  }
}
function writeCache(rows: BookRow[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  } catch {
    /* storage full or blocked: the app works the same, just without the saved copy */
  }
}

// Show the saved copy before the first render; the network result replaces it moments later.
if (supabase) {
  const cached = readCache();
  if (cached) {
    applyPublished(cached);
    resetBookCache();
    ready = true;
  }
}

/** The most-liked published books with only what the cards need. Small, so it arrives fast on a slow network. */
async function loadQuick(seq: number): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase
    .from("books")
    .select(BOOK_COLS)
    .eq("status", "published")
    .order("likes_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(QUICK_LIMIT);
  if (error || !data) {
    console.error("[BookNest] Could not load top books:", error?.message);
    return;
  }
  const rows = data as unknown as BookRow[];
  writeCache(rows);
  if (fullLoaded || seq !== loadSeq) return;
  applyPublished(rows);
  resetBookCache();
  ready = true;
  notify();
}

/**
 * Loads books and authors from Supabase into the in-memory lists the pages read from.
 * Safe to call again at any time (after sign-in, after saving a book). Does nothing when
 * Supabase isn't configured.
 *
 * `quick` (used on the Home page) first fetches only the most-liked books so Trending, Recommended and the
 * Hero fill in right away, then loads everything else in the background.
 */
export async function loadRemote(opts: { quick?: boolean } = {}): Promise<void> {
  if (!supabase) return;
  const seq = ++loadSeq;
  if (opts.quick && !fullLoaded) await loadQuick(seq).catch((e) => console.error("[BookNest] Quick load failed:", e));
  if (seq !== loadSeq) return; // a newer load has started; let it finish
  const me = clerkUser()?.id;

  const [booksRes, authorsRes] = await Promise.all([
    supabase
      .from("books")
      .select(`${BOOK_COLS}, created_by, book_links(type, format, url)`)
      .order("created_at", { ascending: false }),
    supabase.from("authors").select("id, name, genres, bio, about, banner_url, featured_book_id, languages, followers_count, books_count, rating_avg, rating_count, verified, growth_pct, created_at"),
  ]);
  if (booksRes.error) {
    console.error("[BookNest] Could not load books:", booksRes.error.message);
    ready = true;
    notify();
    return;
  }
  if (seq !== loadSeq) return;

  const rows = booksRes.data as unknown as BookRow[];
  const published = rows.filter((r) => r.status === "published");
  applyPublished(published);

  initialMyBooks.splice(
    0,
    initialMyBooks.length,
    ...(me ? rows.filter((r) => r.created_by === me) : []).map<MyBook>((r) => ({
      id: r.id,
      title: r.title,
      cover: r.cover_url || NO_COVER,
      likes: r.likes_count,
      saves: r.saves_count,
      links: linksOf(r),
      discount: discountOf(r),
      status: r.status === "published" ? "Published" : "Draft",
    })),
  );

  if (!authorsRes.error) {
    const monthsAgo = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (30 * 86_400_000)));
    authors.splice(
      0,
      authors.length,
      ...(authorsRes.data as AuthorRow[]).map<Author>((a) => ({
        id: a.id,
        name: a.name,
        genres: a.genres ?? "",
        bio: a.bio ?? "",
        about: a.about ?? undefined,
        bannerUrl: a.banner_url ?? undefined,
        featuredBookId: a.featured_book_id ?? undefined,
        languages: a.languages ? a.languages.split(" · ") : undefined,
        joinedAt: a.created_at,
        followers: a.followers_count,
        books: a.books_count,
        rating: Number(a.rating_avg),
        ratingCount: a.rating_count,
        verified: a.verified,
        growth: Number(a.growth_pct),
        joinedMonthsAgo: monthsAgo(a.created_at),
      })),
    );
  }

  fullLoaded = true;
  ready = true;
  resetBookCache();
  notify();
}

/**
 * Updates one book's like, save and rating numbers without re-downloading the catalog
 * (used after a like, a save or a review).
 */
export async function refreshBookStats(bookId: number): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from("books").select("likes_count, saves_count, rating_avg, rating_count").eq("id", bookId).maybeSingle();
  if (error || !data) return;
  const d = data as { likes_count: number; saves_count: number; rating_avg: number; rating_count: number };
  const c = catalog.find((b) => b.id === bookId);
  if (c) Object.assign(c, { likes: d.likes_count, saves: d.saves_count, rating: Number(d.rating_avg), ratingCount: d.rating_count });
  const r = releases.find((b) => b.id === bookId);
  if (r) Object.assign(r, { likes: String(d.likes_count), saves: String(d.saves_count), likeCount: d.likes_count });
  const m = initialMyBooks.find((b) => b.id === bookId);
  if (m) Object.assign(m, { likes: d.likes_count, saves: d.saves_count });
  resetBookCache();
  notify();
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

export interface NewBook {
  mode: "draft" | "published";
  title: string;
  subtitle: string;
  genre: string;
  language: string;
  description: string;
  releaseDate: string;
  isbn: string;
  publisher: string;
  discountPercent: string;
  discountEnds: string;
  discountCode: string;
  links: { format: LinkFormat; store: LinkStore; url: string }[];
  cover: File | null;
}

export class SaveError extends Error {}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Turns a Supabase / network error into something an author can act on. */
function explain(message: string, code?: string): string {
  if (code === "23505") return "A book with this title already exists. Try a slightly different title.";
  if (/jwt|token|not signed in|row-level security|permission denied/i.test(message))
    return "Supabase didn't accept your sign-in. Check that Clerk is added under Supabase → Authentication → Third-Party Auth, and that you ran the latest supabase/schema.sql.";
  if (/column .* does not exist|schema cache/i.test(message))
    return "The database is missing the newest columns. Run the latest supabase/schema.sql in the Supabase SQL Editor, then try again.";
  if (/failed to fetch|network/i.test(message)) return "Couldn't reach Supabase. Check your connection and the VITE_SUPABASE_URL value.";
  return message;
}

/** Saves a book, its genre, buy links and cover to Supabase for the signed-in author. */
export async function saveBook(input: NewBook): Promise<void> {
  if (!supabase) throw new SaveError("Supabase isn't set up yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the app.");
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in before saving a book.");

  // 1. The author profile (created on first use).
  const { data: author, error: aErr } = await supabase.rpc("ensure_my_author", { p_name: user.fullName ?? user.firstName ?? undefined });
  if (aErr || !author) throw new SaveError(explain(aErr?.message ?? "Could not load your author profile.", aErr?.code));
  const authorId = (author as { id: string }).id;

  const slug = bookSlug(input.title);
  if (!slug) throw new SaveError("Enter a title that has letters or numbers in it.");

  // 2. Cover image -> storage (folder named after the user, as the policies require).
  let coverUrl: string | null = null;
  if (input.cover) {
    const cover = await prepareCover(input.cover);
    const path = `${user.id}/${Date.now()}-${slug}.${EXT[cover.type] ?? "jpg"}`;
    const { error: upErr } = await supabase.storage.from("covers").upload(path, cover, { contentType: cover.type, upsert: false, cacheControl: "31536000" });
    if (upErr) throw new SaveError(explain(`Cover upload failed: ${upErr.message}`));
    coverUrl = supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
  }

  // 3. The book itself.
  const links = input.links
    .map((l) => ({ ...l, url: normalizeUrl(l.url) }))
    .filter((l): l is { format: LinkFormat; store: LinkStore; url: string } => !!l.url);
  const formats = [...new Set(links.flatMap((l) => (l.format === "printed" ? ["Paperback"] : l.format === "ebook" ? ["eBook"] : [])))];

  const { data: book, error: bErr } = await supabase
    .from("books")
    .insert({
      slug,
      title: input.title.trim(),
      subtitle: input.subtitle.trim() || null,
      author_id: authorId,
      cover_url: coverUrl,
      description: input.description.trim() || null,
      language: input.language || null,
      isbn: input.isbn.replace(/[-\s]/g, "") || null,
      publisher: input.publisher.trim() || null,
      formats,
      status: input.mode,
      release_date: input.releaseDate || null,
      discount_percent: input.discountPercent.trim() ? Number(input.discountPercent) : null,
      discount_ends_on: input.discountEnds || null,
      discount_code: input.discountCode.trim() || null,
    })
    .select("id")
    .single();
  if (bErr || !book) throw new SaveError(explain(bErr?.message ?? "Could not save the book.", bErr?.code));
  const bookId = (book as { id: number }).id;

  // 4. Genre and buy links. If either fails, remove the half-saved book so nothing is left behind.
  const undo = async () => void (await supabase!.from("books").delete().eq("id", bookId));

  if (input.genre) {
    const { error } = await supabase.from("book_genres").insert({ book_id: bookId, genre_slug: genreSlug(input.genre), position: 0 });
    if (error) {
      await undo();
      throw new SaveError(explain(error.message, error.code));
    }
  }
  if (links.length) {
    const { error } = await supabase
      .from("book_links")
      .insert(links.map((l) => ({ book_id: bookId, type: l.store, format: l.format, url: l.url })));
    if (error) {
      await undo();
      throw new SaveError(explain(error.message, error.code));
    }
  }
}

/* ------------------------------------------------------------------ */
/* My profile (the signed-in author's row in `authors`)                */
/* ------------------------------------------------------------------ */

export interface Prefs {
  emailUpdates: boolean;
  followerAlerts: boolean;
  showFollowers: boolean;
  /** Set once the new-account "tell us about yourself" prompt has been completed or skipped. */
  onboarded?: boolean;
}
export const DEFAULT_PREFS: Prefs = { emailUpdates: true, followerAlerts: true, showFollowers: true };

interface MyAuthorRow {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  about: string | null;
  genres: string | null;
  banner_url: string | null;
  featured_book_id: number | null;
  languages: string | null;
  location: string | null;
  website: string | null;
  socials: Record<string, string> | null;
  avatar_url: string | null;
  verified: boolean;
  followers_count: number;
  prefs: Partial<Prefs> | null;
  created_at: string;
}

export interface MyProfile {
  authorId: string;
  profile: Profile;
  avatarUrl: string | null;
  bannerUrl: string | null;
  prefs: Prefs;
  /** A brand-new account that hasn't seen the welcome prompt yet. */
  isNew: boolean;
}

const requireClient = () => {
  if (!supabase) throw new SaveError("Supabase isn't set up yet. Add your keys to .env.local and restart the app.");
  return supabase;
};

/** Loads (creating it on first sign-in) the signed-in user's profile. Null when signed out or Supabase is off. */
export async function loadMyProfile(): Promise<MyProfile | null> {
  const user = clerkUser();
  if (!supabase || !user) return null;
  const { data, error } = await supabase.rpc("ensure_my_author", { p_name: user.fullName ?? user.firstName ?? undefined });
  if (error || !data) {
    console.error("[BookNest] Could not load your profile:", error?.message);
    return null;
  }
  const a = data as MyAuthorRow;
  const { data: priv } = await supabase.from("author_private").select("real_name").eq("user_id", user.id).maybeSingle();
  const { count } = await supabase.from("follows").select("author_id", { count: "exact", head: true }).eq("follower_id", user.id);
  return {
    authorId: a.id,
    avatarUrl: a.avatar_url,
    bannerUrl: a.banner_url,
    prefs: { ...DEFAULT_PREFS, ...(a.prefs ?? {}) },
    // Only accounts created in the last 15 minutes are prompted, so existing users are never interrupted.
    isNew: !a.prefs?.onboarded && Date.now() - new Date(a.created_at).getTime() < 15 * 60 * 1000,
    profile: {
      name: a.name,
      username: a.username ?? "",
      verified: a.verified,
      bio: a.bio ?? "",
      about: a.about ?? "",
      realName: (priv as { real_name: string | null } | null)?.real_name ?? "",
      featuredBookId: a.featured_book_id,
      languages: (a.languages ?? "").split(" · ").map((l) => l.trim()).filter(Boolean),
      joinedAt: a.created_at,
      genres: (a.genres ?? "").split(" · ").map((g) => g.trim()).filter(Boolean),
      location: a.location ?? "",
      website: a.website ?? "",
      socials: (a.socials ?? {}) as Profile["socials"],
      followers: a.followers_count,
      following: count ?? 0,
    },
  };
}

/** Saves edits to the signed-in author's profile. */
export async function saveMyProfile(patch: Partial<Pick<Profile, "name" | "username" | "bio" | "about" | "genres" | "languages" | "realName" | "featuredBookId" | "location" | "website" | "socials">>): Promise<void> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in first.");
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.username !== undefined) row.username = patch.username || null;
  if (patch.bio !== undefined) row.bio = patch.bio || null;
  if (patch.about !== undefined) row.about = patch.about || null;
  if (patch.genres !== undefined) row.genres = patch.genres.join(" · ") || null;
  if (patch.location !== undefined) row.location = patch.location || null;
  if (patch.website !== undefined) row.website = patch.website || null;
  if (patch.socials !== undefined) row.socials = patch.socials;
  if (patch.languages !== undefined) row.languages = patch.languages.join(" · ") || null;
  if (patch.featuredBookId !== undefined) row.featured_book_id = patch.featuredBookId;
  if (patch.realName !== undefined) {
    const { error: pErr } = await sb.from("author_private").upsert({ user_id: user.id, real_name: patch.realName.trim() || null, updated_at: new Date().toISOString() });
    if (pErr) throw new SaveError(explain(pErr.message, pErr.code));
  }
  if (Object.keys(row).length === 0) return;
  const { error } = await sb.from("authors").update(row).eq("user_id", user.id);
  if (error) {
    if (error.code === "23505") throw new SaveError("That username is already taken. Try another one.");
    throw new SaveError(explain(error.message, error.code));
  }
}

/** Uploads a profile photo and saves its address. Returns the public URL. */
export async function saveAvatar(file: File): Promise<string> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in first.");
  const path = `${user.id}/avatar-${Date.now()}.${EXT[file.type] ?? "jpg"}`;
  const { error: upErr } = await sb.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw new SaveError(explain(`Photo upload failed: ${upErr.message}`));
  const url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const { error } = await sb.from("authors").update({ avatar_url: url }).eq("user_id", user.id);
  if (error) throw new SaveError(explain(error.message, error.code));
  return url;
}

/** Id of the signed-in user, if any. */
export const currentUserId = () => clerkUser()?.id ?? null;

/** Uploads a picture for a template website (stored with the covers, in the user's own folder). Returns its public URL. */
export async function saveSiteImage(file: File): Promise<string> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in first.");
  const path = `${user.id}/site-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${EXT[file.type] ?? "jpg"}`;
  const { error } = await sb.storage.from("covers").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new SaveError(explain(`Photo upload failed: ${error.message}`));
  return sb.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

/** Uploads a cover banner (or removes it when `file` is null). Returns the public URL, or null when removed. */
export async function saveBanner(file: File | null): Promise<string | null> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in first.");
  let url: string | null = null;
  if (file) {
    const path = `${user.id}/banner-${Date.now()}.${EXT[file.type] ?? "jpg"}`;
    const { error: upErr } = await sb.storage.from("banners").upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw new SaveError(explain(`Banner upload failed: ${upErr.message}`));
    url = sb.storage.from("banners").getPublicUrl(path).data.publicUrl;
  }
  const { error } = await sb.from("authors").update({ banner_url: url }).eq("user_id", user.id);
  if (error) throw new SaveError(explain(error.message, error.code));
  return url;
}

export async function saveMyPrefs(prefs: Prefs): Promise<void> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) return;
  const { error } = await sb.from("authors").update({ prefs }).eq("user_id", user.id);
  if (error) throw new SaveError(explain(error.message, error.code));
}

/* ------------------------------------------------------------------ */
/* Follows                                                             */
/* ------------------------------------------------------------------ */

export async function loadMyFollows(): Promise<Set<string>> {
  const user = clerkUser();
  if (!supabase || !user) return new Set();
  const { data, error } = await supabase.from("follows").select("author_id").eq("follower_id", user.id);
  if (error) {
    console.error("[BookNest] Could not load follows:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r: { author_id: string }) => r.author_id));
}

export async function setFollow(authorId: string, follow: boolean): Promise<void> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in first.");
  const { error } = follow
    ? await sb.from("follows").insert({ author_id: authorId })
    : await sb.from("follows").delete().eq("author_id", authorId).eq("follower_id", user.id);
  if (error && error.code !== "23505") throw new SaveError(explain(error.message, error.code));
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

interface NotificationRow {
  id: number;
  type: AppNotification["type"];
  actor_name: string | null;
  title: string;
  detail: string | null;
  detail_kind: "book" | "quote" | null;
  cover_url: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} hr ago`;
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)} d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function loadNotifications(): Promise<AppNotification[]> {
  const user = clerkUser();
  if (!supabase || !user) return [];
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (error) {
    console.error("[BookNest] Could not load notifications:", error.message);
    return [];
  }
  return (data as NotificationRow[]).map((n) => ({
    id: n.id,
    type: n.type,
    actor: n.actor_name ?? undefined,
    title: n.title,
    detail: n.detail ?? undefined,
    detailKind: n.detail_kind ?? undefined,
    time: timeAgo(n.created_at),
    cover: n.cover_url ?? undefined,
    read: n.read,
  }));
}

export async function setNotificationRead(ids: number[] | "all", read: boolean): Promise<void> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) return;
  let q = sb.from("notifications").update({ read }).eq("user_id", user.id);
  if (ids !== "all") q = q.in("id", ids);
  const { error } = await q;
  if (error) throw new SaveError(explain(error.message, error.code));
}

export async function deleteNotification(id: number): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("notifications").delete().eq("id", id);
  if (error) throw new SaveError(explain(error.message, error.code));
}

/* ------------------------------------------------------------------ */
/* Website templates (the author's edited site for each template)      */
/* ------------------------------------------------------------------ */

export async function loadSiteDoc<T>(templateId: string): Promise<T | null> {
  const user = clerkUser();
  if (!supabase || !user) return null;
  const { data, error } = await supabase.from("site_docs").select("doc").eq("user_id", user.id).eq("template_id", templateId).maybeSingle();
  if (error) {
    console.error("[BookNest] Could not load your site:", error.message);
    return null;
  }
  return (data?.doc as T | undefined) ?? null;
}

export async function saveSiteDoc(templateId: string, doc: unknown): Promise<void> {
  const user = clerkUser();
  if (!supabase || !user) return;
  const { error } = await supabase
    .from("site_docs")
    .upsert({ user_id: user.id, template_id: templateId, doc, updated_at: new Date().toISOString() }, { onConflict: "user_id,template_id" });
  if (error) throw new SaveError(explain(error.message, error.code));
}

export async function deleteSiteDoc(templateId: string): Promise<void> {
  const user = clerkUser();
  if (!supabase || !user) return;
  await supabase.from("site_docs").delete().eq("user_id", user.id).eq("template_id", templateId);
}

/* ------------------------------------------------------------------ */
/* Published websites (a public snapshot of the author's site)         */
/* ------------------------------------------------------------------ */

/** Names nobody may use as a site address. Keep in sync with supabase/publish-sites.sql. */
const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "www", "app", "api", "admin", "mail", "ftp", "blog", "help", "support", "static", "assets", "cdn", "dev", "test",
  "staging", "status", "docs", "login", "auth", "dashboard", "billing", "ns1", "ns2", "smtp", "imap", "pop", "booknest",
]);

/** The site address for a username: lowercase, underscores become hyphens, no leading or trailing hyphens. */
export const subdomainFor = (username: string): string => username.trim().toLowerCase().replace(/_/g, "-").replace(/^-+|-+$/g, "");

export const isReservedSubdomain = (name: string): boolean => RESERVED_SUBDOMAINS.has(name.trim().toLowerCase());

/** Like explain(), with the messages the publish trigger and constraints can produce. */
function explainPublish(message: string, code?: string): string {
  if (/username_required/.test(message)) return "Set a username in your profile before publishing.";
  if (/subdomain_mismatch/.test(message)) return "Your site address must match your username. Check your username in your profile, then publish again.";
  if (code === "23505" || /subdomain_taken|duplicate key/i.test(message))
    return "That site address is already taken by another author. Change your username in your profile and try again.";
  if (code === "23514" && /not_reserved/.test(message)) return "That name is reserved and can't be used as a site address. Change your username in your profile.";
  if (code === "23514") return "Your username can't be used as a site address. Choose one with at least 3 letters or numbers.";
  if (code === "PGRST205" || (/published_sites/.test(message) && /does not exist|schema cache/i.test(message)))
    return "Publishing isn't set up in the database yet. Run supabase/publish-sites.sql in the Supabase SQL Editor, then try again.";
  return explain(message, code);
}

/**
 * Publishes (or updates) the signed-in author's site: saves a copy of `doc` that the public can see at
 * their address. Autosave never touches this copy; only this call does.
 */
export async function publishSite(templateId: string, doc: SiteDoc, meta: { title?: string; authorName?: string } = {}): Promise<{ subdomain: string }> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in before publishing your site.");

  const { data: me, error: meErr } = await sb.from("authors").select("username, name").eq("user_id", user.id).maybeSingle();
  if (meErr) throw new SaveError(explainPublish(meErr.message, meErr.code));
  const mine = me as { username: string | null; name: string } | null;
  if (!mine?.username?.trim()) throw new SaveError("Set a username in your profile before publishing.");

  const subdomain = subdomainFor(mine.username);
  if (!SUBDOMAIN_RE.test(subdomain))
    throw new SaveError("Your username is too short to be a site address. Choose one with at least 3 letters or numbers in your profile.");
  if (isReservedSubdomain(subdomain))
    throw new SaveError(`"${subdomain}" is reserved and can't be used as a site address. Choose a different username in your profile.`);

  // One live site per author: publishing again replaces their existing row.
  const { error } = await sb.from("published_sites").upsert(
    {
      subdomain,
      user_id: user.id,
      template_id: templateId,
      doc,
      author_name: meta.authorName?.trim() || mine.name || null,
      title: meta.title?.trim() || null,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new SaveError(explainPublish(error.message, error.code));
  return { subdomain };
}

/** Takes the signed-in author's site offline. */
export async function unpublishSite(): Promise<void> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in first.");
  const { error } = await sb.from("published_sites").delete().eq("user_id", user.id);
  if (error) throw new SaveError(explainPublish(error.message, error.code));
}

/** The signed-in author's live site, or null if they haven't published (or are signed out). */
export async function getMyPublishedSite(): Promise<{ subdomain: string; templateId: string; doc: unknown; publishedAt: string } | null> {
  const user = clerkUser();
  if (!supabase || !user) return null;
  const { data, error } = await supabase.from("published_sites").select("subdomain, template_id, doc, published_at").eq("user_id", user.id).maybeSingle();
  if (error) throw new SaveError(explainPublish(error.message, error.code));
  if (!data) return null;
  const r = data as { subdomain: string; template_id: string; doc: unknown; published_at: string };
  return { subdomain: r.subdomain, templateId: r.template_id, doc: r.doc, publishedAt: r.published_at };
}

/** A published site for the public page. Works signed out (anon key). Null when no such site exists. */
export async function loadPublishedSite(subdomain: string): Promise<{ doc: unknown; title?: string; authorName?: string } | null> {
  if (!supabase) return null;
  const name = subdomain.trim().toLowerCase();
  if (!SUBDOMAIN_RE.test(name)) return null;
  const { data, error } = await supabase.from("published_sites").select("doc, title, author_name").eq("subdomain", name).maybeSingle();
  if (error) throw new SaveError(explainPublish(error.message, error.code));
  if (!data) return null;
  const r = data as { doc: unknown; title: string | null; author_name: string | null };
  return { doc: r.doc, title: r.title ?? undefined, authorName: r.author_name ?? undefined };
}

/* ------------------------------------------------------------------ */
/* Likes and saves                                                     */
/* ------------------------------------------------------------------ */

export async function loadMyLibrary(): Promise<{ likes: Set<number>; saves: Set<number> }> {
  const user = clerkUser();
  const empty = { likes: new Set<number>(), saves: new Set<number>() };
  if (!supabase || !user) return empty;
  const [likes, saves] = await Promise.all([
    supabase.from("book_likes").select("book_id").eq("user_id", user.id),
    supabase.from("book_saves").select("book_id").eq("user_id", user.id),
  ]);
  return {
    likes: new Set((likes.data ?? []).map((r: { book_id: number }) => r.book_id)),
    saves: new Set((saves.data ?? []).map((r: { book_id: number }) => r.book_id)),
  };
}

export async function setBookFlag(kind: "like" | "save", bookId: number, on: boolean): Promise<void> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in first.");
  const table = kind === "like" ? "book_likes" : "book_saves";
  const { error } = on
    ? await sb.from(table).insert({ book_id: bookId })
    : await sb.from(table).delete().eq("book_id", bookId).eq("user_id", user.id);
  if (error && error.code !== "23505") throw new SaveError(explain(error.message, error.code));
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export interface Review {
  id: number;
  userId: string;
  name: string;
  avatar: string | null;
  rating: number;
  body: string;
  createdAt: string;
  mine: boolean;
  reply: ReviewReply | null;
  /** Set when reviews from several books are listed together. */
  bookId?: number;
  bookTitle?: string;
}

export interface ReviewReply {
  id: number;
  body: string;
  createdAt: string;
}

export interface ReviewsResult {
  reviews: Review[];
  /** True when the signed-in user is the author of this book (they may reply, not review). */
  isAuthor: boolean;
}

export async function loadReviews(bookId: number): Promise<ReviewsResult> {
  if (!supabase) return { reviews: [], isAuthor: false };
  const me = clerkUser()?.id;
  let isAuthor = false;
  if (me) {
    const { data: b } = await supabase.from("books").select("created_by").eq("id", bookId).maybeSingle();
    isAuthor = (b as { created_by: string | null } | null)?.created_by === me;
  }
  const { data, error } = await supabase
    .from("reviews")
    .select("id, user_id, rating, body, created_at")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[BookNest] Could not load reviews:", error.message);
    return { reviews: [], isAuthor };
  }
  return { reviews: await hydrateReviews(data as ReviewRow[], me), isAuthor };
}

interface ReviewRow { id: number; book_id?: number; user_id: string; rating: number; body: string | null; created_at: string }

/** Adds reviewer names, photos and author replies to raw review rows. */
async function hydrateReviews(rows: ReviewRow[], me: string | undefined): Promise<Review[]> {
  if (!supabase) return [];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const people = new Map<string, { name: string; avatar_url: string | null }>();
  if (ids.length) {
    const { data: a } = await supabase.from("authors").select("user_id, name, avatar_url").in("user_id", ids);
    (a ?? []).forEach((p: { user_id: string; name: string; avatar_url: string | null }) => people.set(p.user_id, p));
  }
  const replies = new Map<number, ReviewReply>();
  if (rows.length) {
    const { data: rp } = await supabase.from("review_replies").select("id, review_id, body, created_at").in("review_id", rows.map((r) => r.id));
    (rp ?? []).forEach((x: { id: number; review_id: number; body: string; created_at: string }) =>
      replies.set(x.review_id, { id: x.id, body: x.body, createdAt: x.created_at }));
  }
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: people.get(r.user_id)?.name ?? "A reader",
    avatar: people.get(r.user_id)?.avatar_url ?? null,
    rating: r.rating,
    body: r.body ?? "",
    createdAt: r.created_at,
    mine: r.user_id === me,
    reply: replies.get(r.id) ?? null,
    bookId: r.book_id,
  }));
}

/* ------------------------------------------------------------------ */
/* Verification requests                                               */
/* ------------------------------------------------------------------ */

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

/** Status of the signed-in author's latest verification request. */
export async function loadMyVerification(): Promise<VerificationStatus> {
  const user = clerkUser();
  if (!supabase || !user) return "none";
  const { data } = await supabase.from("verification_requests").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return ((data as { status: VerificationStatus } | null)?.status) ?? "none";
}

export async function requestVerification(authorId: string, note: string): Promise<void> {
  const sb = requireClient();
  if (!clerkUser()) throw new SaveError("Please sign in first.");
  const { error } = await sb.from("verification_requests").insert({ author_id: authorId, note: note.trim() || null });
  if (error) {
    if (error.code === "23505") throw new SaveError("You already have a request waiting for review.");
    if (/row-level security/i.test(error.message)) throw new SaveError("You need at least one published book before you can ask to be verified.");
    throw new SaveError(explain(error.message, error.code));
  }
}

/* ------------------------------------------------------------------ */
/* Author posts (news for followers)                                   */
/* ------------------------------------------------------------------ */

export interface AuthorPost {
  id: number;
  body: string;
  createdAt: string;
}

export async function loadPosts(authorId: string): Promise<AuthorPost[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("author_posts")
    .select("id, body, created_at")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[BookNest] Could not load posts:", error.message);
    return [];
  }
  return (data as { id: number; body: string; created_at: string }[]).map((p) => ({ id: p.id, body: p.body, createdAt: p.created_at }));
}

export async function addPost(authorId: string, body: string): Promise<void> {
  const sb = requireClient();
  if (!clerkUser()) throw new SaveError("Please sign in first.");
  const text = body.trim();
  if (!text) throw new SaveError("Write something first.");
  const { error } = await sb.from("author_posts").insert({ author_id: authorId, body: text });
  if (error) throw new SaveError(explain(error.message, error.code));
}

export async function deletePost(id: number): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("author_posts").delete().eq("id", id);
  if (error) throw new SaveError(explain(error.message, error.code));
}

/** Every review on the given books, newest first, each tagged with its book. */
export async function loadReviewsOnBooks(books: { id: number; title: string }[]): Promise<Review[]> {
  if (!supabase || books.length === 0) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("id, book_id, user_id, rating, body, created_at")
    .in("book_id", books.map((b) => b.id))
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[BookNest] Could not load reviews:", error.message);
    return [];
  }
  const titles = new Map(books.map((b) => [b.id, b.title]));
  const list = await hydrateReviews(data as ReviewRow[], clerkUser()?.id);
  return list.map((r) => ({ ...r, bookTitle: titles.get(r.bookId ?? -1) }));
}

/** The book's author replies to a review (or edits their earlier reply). */
export async function saveReply(reviewId: number, body: string): Promise<void> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in first.");
  const text = body.trim();
  if (!text) throw new SaveError("Write a reply first.");
  const { data: existing } = await sb.from("review_replies").select("id").eq("review_id", reviewId).maybeSingle();
  const { error } = existing
    ? await sb.from("review_replies").update({ body: text }).eq("id", (existing as { id: number }).id)
    : await sb.from("review_replies").insert({ review_id: reviewId, body: text });
  if (error) throw new SaveError(explain(error.message, error.code));
}

export async function deleteReply(id: number): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("review_replies").delete().eq("id", id);
  if (error) throw new SaveError(explain(error.message, error.code));
}

/** Adds the signed-in user's review, or replaces it if they already reviewed this book. */
export async function saveReview(bookId: number, rating: number, body: string): Promise<void> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in first.");
  const text = body.trim() || null;
  const { data: existing } = await sb.from("reviews").select("id").eq("book_id", bookId).eq("user_id", user.id).maybeSingle();
  const { error } = existing
    ? await sb.from("reviews").update({ rating, body: text }).eq("id", (existing as { id: number }).id)
    : await sb.from("reviews").insert({ book_id: bookId, rating, body: text });
  if (error) throw new SaveError(explain(error.message, error.code));
}

export async function deleteReview(id: number): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("reviews").delete().eq("id", id);
  if (error) throw new SaveError(explain(error.message, error.code));
}

/* ------------------------------------------------------------------ */
/* Editing and deleting my books                                       */
/* ------------------------------------------------------------------ */

export async function deleteBook(id: number): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("books").delete().eq("id", id);
  if (error) throw new SaveError(explain(error.message, error.code));
}

export interface EditableBook {
  status: "draft" | "published";
  title: string;
  subtitle: string;
  genre: string;
  language: string;
  description: string;
  releaseDate: string;
  isbn: string;
  publisher: string;
  discountPercent: string;
  discountEnds: string;
  discountCode: string;
  links: { format: LinkFormat; store: LinkStore; url: string }[];
  coverUrl: string | null;
}

/** Loads one of the signed-in author's own books, with everything the form needs. */
export async function loadBookForEdit(id: number): Promise<EditableBook | null> {
  const sb = supabase;
  const user = clerkUser();
  if (!sb || !user) return null;
  const { data, error } = await sb
    .from("books")
    .select("*, book_genres(position, genres(name)), book_links(type, format, url)")
    .eq("id", id)
    .eq("created_by", user.id)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const genres = [...(r.book_genres ?? [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position);
  return {
    status: r.status,
    title: r.title ?? "",
    subtitle: r.subtitle ?? "",
    genre: genres[0]?.genres?.name ?? "",
    language: r.language ?? "English",
    description: r.description ?? "",
    releaseDate: r.release_date ?? "",
    isbn: r.isbn ?? "",
    publisher: r.publisher ?? "",
    discountPercent: r.discount_percent ? String(r.discount_percent) : "",
    discountEnds: r.discount_ends_on ?? "",
    discountCode: r.discount_code ?? "",
    links: (r.book_links ?? []).map((l: { type: string; format: LinkFormat; url: string }) => ({
      format: l.format,
      store: (l.type === "amazon" ? "amazon" : "other") as LinkStore,
      url: l.url,
    })),
    coverUrl: r.cover_url ?? null,
  };
}

/** Saves changes to an existing book: details, genre, buy links and (optionally) a new cover. */
export async function updateBook(id: number, input: NewBook, keepCoverUrl: string | null): Promise<void> {
  const sb = requireClient();
  const user = clerkUser();
  if (!user) throw new SaveError("Please sign in first.");
  const slug = bookSlug(input.title);
  if (!slug) throw new SaveError("Enter a title that has letters or numbers in it.");

  let coverUrl = keepCoverUrl;
  if (input.cover) {
    const cover = await prepareCover(input.cover);
    const path = `${user.id}/${Date.now()}-${slug}.${EXT[cover.type] ?? "jpg"}`;
    const { error: upErr } = await sb.storage.from("covers").upload(path, cover, { contentType: cover.type, upsert: false, cacheControl: "31536000" });
    if (upErr) throw new SaveError(explain(`Cover upload failed: ${upErr.message}`));
    coverUrl = sb.storage.from("covers").getPublicUrl(path).data.publicUrl;
  }

  const links = input.links
    .map((l) => ({ ...l, url: normalizeUrl(l.url) }))
    .filter((l): l is { format: LinkFormat; store: LinkStore; url: string } => !!l.url);
  const formats = [...new Set(links.flatMap((l) => (l.format === "printed" ? ["Paperback"] : l.format === "ebook" ? ["eBook"] : [])))];

  const { error: bErr } = await sb
    .from("books")
    .update({
      slug,
      title: input.title.trim(),
      subtitle: input.subtitle.trim() || null,
      cover_url: coverUrl,
      description: input.description.trim() || null,
      language: input.language || null,
      isbn: input.isbn.replace(/[-\s]/g, "") || null,
      publisher: input.publisher.trim() || null,
      formats,
      status: input.mode,
      release_date: input.releaseDate || null,
      discount_percent: input.discountPercent.trim() ? Number(input.discountPercent) : null,
      discount_ends_on: input.discountEnds || null,
      discount_code: input.discountCode.trim() || null,
    })
    .eq("id", id)
    .eq("created_by", user.id);
  if (bErr) throw new SaveError(explain(bErr.message, bErr.code));

  // Replace genre and links with what the form now holds.
  await sb.from("book_genres").delete().eq("book_id", id);
  if (input.genre) {
    const { error } = await sb.from("book_genres").insert({ book_id: id, genre_slug: genreSlug(input.genre), position: 0 });
    if (error) throw new SaveError(explain(error.message, error.code));
  }
  await sb.from("book_links").delete().eq("book_id", id);
  if (links.length) {
    const { error } = await sb.from("book_links").insert(links.map((l) => ({ book_id: id, type: l.store, format: l.format, url: l.url })));
    if (error) throw new SaveError(explain(error.message, error.code));
  }
}
