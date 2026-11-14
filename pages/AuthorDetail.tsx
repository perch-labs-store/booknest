import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, CalendarDays, Globe, Heart, Languages, Star, Tag, UserX, Users, ExternalLink } from "lucide-react";
import Avatar from "../components/Avatar";
import FollowButton from "../components/FollowButton";
import { useFollow } from "../context/FollowContext";
import { bookSlug } from "../data/allBooks";
import { activeDiscount } from "../data/discount";
import { getAuthorById, getBooksByAuthor, type AuthorBook } from "../data/authorBooks";
import { useProfile } from "../context/ProfileContext";
import SocialLinks from "../components/SocialLinks";
import FeaturedBook from "../components/FeaturedBook";
import AuthorPosts from "../components/AuthorPosts";
import ShareProfile from "../components/ShareProfile";
import { catalog } from "../data/catalog";
import GenreTag from "../components/GenreTag";
import type { SocialLinks as Socials } from "../data/socials";
import type { Author } from "../data/authors";
import { compact } from "../utils/format";

const TABS = ["Books", "About", "Updates", "Reviews"] as const;
type Tab = (typeof TABS)[number];
const PREVIEW = 6;

const DAY = 86_400_000;
const fmtDate = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * DAY).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const joined = (months: number) =>
  months < 1 ? "this month" : months < 12 ? `${months} month${months === 1 ? "" : "s"} ago` : `${Math.floor(months / 12)} year${months >= 24 ? "s" : ""} ago`;

function Banner({ url }: { url?: string }) {
  if (url) return <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />;
  return (
    <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="adSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B2038" />
          <stop offset="0.55" stopColor="#7A4A5E" />
          <stop offset="1" stopColor="#E59A5B" />
        </linearGradient>
      </defs>
      <rect width="1200" height="260" fill="url(#adSky)" />
      <circle cx="930" cy="130" r="30" fill="#FFE2A8" opacity="0.8" />
      <path d="M0 260V150l120-50 90 40 150-90 130 80 110-60 160 100 120-50 140 70 180-60v180z" fill="#3A2F52" />
      <path d="M0 260V190l140-40 110 30 170-60 150 70 140-40 180 60 130-30 180 40v40z" fill="#1E1730" />
    </svg>
  );
}

function BookTile({ book }: { book: AuthorBook }) {
  const upcoming = (book.daysAgo ?? 0) < 0;
  const discount = activeDiscount(book.discount);
  return (
    <Link to={`/books/${bookSlug(book.title)}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        {discount && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">
            {discount.percent}% off
          </span>
        )}
        {upcoming && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-[#14181F] shadow">
            Upcoming
          </span>
        )}
        <img src={book.cover} alt={`${book.title} cover`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <h3 className="mt-2.5 truncate text-sm font-semibold text-ink">{book.title}</h3>
      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-ink">
        {book.rating !== undefined ? (
          <>
            <Star size={13} className="fill-brand text-brand" /> {book.rating.toFixed(1)}
            <span className="font-normal text-muted">({book.ratingCount?.toLocaleString("en-US")})</span>
          </>
        ) : upcoming ? (
          <span className="font-normal text-accent">Releases {fmtDate(book.daysAgo!)}</span>
        ) : book.likes !== undefined ? (
          <span className="flex items-center gap-1 font-normal text-muted"><Heart size={13} /> {compact(book.likes)}</span>
        ) : (
          <span className="font-normal text-muted">&nbsp;</span>
        )}
      </p>
    </Link>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}

function AboutCard({ author, website, socials }: { author: Author; website?: string; socials?: Socials }) {
  return (
    <aside className="h-fit rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-serif text-lg font-bold text-ink">About {author.name}</h2>
      <p className="mt-3 line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-ink/90">{author.bio || `${author.name} writes ${author.genres.split(" · ").join(", ")}.`}</p>
      <ul className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
        <li className="flex items-start gap-2.5 text-muted">
          <Tag size={15} className="mt-0.5 shrink-0" />
          <span className="flex flex-wrap gap-1.5">
            {author.genres.split(" · ").map((g) => (
              <GenreTag key={g} name={g} className="rounded-md border border-line px-2 py-0.5 text-xs text-ink/90" />
            ))}
          </span>
        </li>
        {author.languages && author.languages.length > 0 && (
          <li className="flex items-center gap-2.5 text-muted"><Languages size={15} className="shrink-0" /> Writes in {author.languages.join(", ")}</li>
        )}
        <li className="flex items-center gap-2.5 text-muted">
          <CalendarDays size={15} className="shrink-0" />
          {author.joinedAt ? `Member since ${new Date(author.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : `Joined ${joined(author.joinedMonthsAgo)}`}
        </li>
        {website && (
          <li className="flex items-center gap-2.5">
            <Globe size={15} className="shrink-0 text-muted" />
            <a href={`https://${website}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{website}</a>
          </li>
        )}
      </ul>
      <SocialLinks links={socials} className="mt-4 border-t border-line pt-4" />
    </aside>
  );
}

export default function AuthorDetail() {
  const { id } = useParams();
  const author = getAuthorById(id);
  const { following, toggle } = useFollow();
  const { profile, authorId: myAuthorId } = useProfile();
  const [tab, setTab] = useState<Tab>("Books");
  const [showAll, setShowAll] = useState(false);

  const books = useMemo(() => (author ? getBooksByAuthor(author) : []), [author]);

  if (!author) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <UserX size={36} className="mb-3 text-muted" />
        <h1 className="font-serif text-2xl font-bold text-ink">Author not found</h1>
        <Link to="/top-authors" className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-[#14181F]">Browse top authors</Link>
      </div>
    );
  }

  const isFollowing = following.has(author.id);
  const followers = author.followers + (isFollowing ? 1 : 0);
  // Website and social links come from the signed-in author's profile (the only place they exist in the data).
  const isMe = Boolean(myAuthorId) && author.id === myAuthorId;
  const website = isMe ? profile.website || undefined : undefined;
  const socials = isMe ? profile.socials : undefined;
  const featured = author.featuredBookId ? catalog.find((b) => b.id === author.featuredBookId) : undefined;
  const released = books.filter((b) => (b.daysAgo ?? 0) >= 0);
  const updates = books.filter((b) => b.daysAgo !== undefined).sort((a, b) => a.daysAgo! - b.daysAgo!);
  const shown = showAll ? books : books.slice(0, PREVIEW);

  const stats = [
    { icon: BookOpen, value: String(author.books), label: "Books" },
    { icon: Users, value: compact(followers), label: "Followers" },
    { icon: Star, value: author.ratingCount > 0 ? author.rating.toFixed(1) : "—", label: "Rating" },
  ];

  return (
    <>
      <Link to="/top-authors" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={15} /> Top Authors
      </Link>

      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-line text-white">
        <Banner url={author.bannerUrl} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
        <div className="relative flex flex-col gap-6 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <Avatar name={author.name} className="h-24 w-24 text-3xl ring-4 ring-white/80 sm:h-28 sm:w-28 sm:text-4xl" />
              {author.verified && (
                <span className="absolute bottom-0 right-0 rounded-full bg-brand p-1 text-[#14181F] ring-2 ring-black/40" title="Verified author">
                  <BadgeCheck size={14} aria-label="Verified" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 font-serif text-2xl font-bold sm:text-3xl">
                <span className="truncate">{author.name}</span>
                {author.verified && <BadgeCheck size={20} className="shrink-0 text-brand" aria-label="Verified" />}
              </h1>
              <p className="mt-1 max-w-md text-sm text-white/80">{author.bio || author.genres}</p>
              <dl className="mt-4 flex gap-6 sm:gap-8">
                {stats.map(({ icon: Icon, value, label }) => (
                  <div key={label}>
                    <dd className="flex items-center gap-1.5 text-base font-bold sm:text-lg"><Icon size={16} className="text-white/70" /> {value}</dd>
                    <dt className="text-xs text-white/70">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="flex gap-3 md:flex-col md:items-stretch">
            <FollowButton following={isFollowing} onToggle={() => toggle(author.id)} className="!px-6 !py-2.5 !text-sm md:min-w-[140px]" />
            <ShareProfile authorId={author.id} name={author.name} className="flex items-center justify-center gap-1.5 rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10" />
            {website && (
              <a
                href={`https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <ExternalLink size={14} /> Website
              </a>
            )}
          </div>
        </div>
      </section>

      {featured && <div className="mt-6"><FeaturedBook book={featured} /></div>}

      {/* Tabs */}
      <div role="tablist" className="no-scrollbar mb-6 mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={t === tab}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              t === tab ? "border-b-2 border-brand bg-brand/20 text-ink" : "text-muted hover:bg-brand/10 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${tab === "About" ? "" : "lg:grid-cols-[1fr_300px]"}`}>
        <div className="min-w-0">
          {tab === "Books" && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-ink">Books by {author.name}</h2>
                {books.length > PREVIEW && (
                  <button onClick={() => setShowAll((v) => !v)} className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                    {showAll ? "Show less" : `View All (${books.length})`} {!showAll && <ArrowRight size={14} />}
                  </button>
                )}
              </div>
              {books.length ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                  {shown.map((b) => <BookTile key={b.key} book={b} />)}
                </div>
              ) : (
                <Empty title="No books to show yet" text={`${author.name}'s books will appear here.`} />
              )}
            </section>
          )}

          {tab === "About" && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <h2 className="font-serif text-xl font-bold text-ink">About {author.name}</h2>
                {author.bio && author.about && <p className="mt-2 text-sm font-medium text-ink">{author.bio}</p>}
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/90">{author.about || author.bio || `${author.name} writes ${author.genres.split(" · ").join(", ")}.`}</p>
              </div>
              {socials && Object.keys(socials).length > 0 && (
                <div className="rounded-2xl border border-line bg-surface p-5">
                  <h3 className="mb-3 text-sm font-semibold text-ink">Find {author.name} online</h3>
                  <SocialLinks links={socials} />
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {[
                  ["Books", String(author.books)],
                  ["Followers", compact(followers)],
                  ["Rating", author.ratingCount > 0 ? author.rating.toFixed(1) : "—"],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-2xl border border-line bg-surface p-4">
                    <p className="text-xs text-muted">{l}</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-ink">{v}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "Updates" && (
            <div className="space-y-6">
              <AuthorPosts authorId={author.id} />
              {updates.length > 0 && <h2 className="font-serif text-xl font-bold text-ink">Releases</h2>}
              {updates.length > 0 && (
                <ul className="space-y-3">
                  {updates.map((b) => (
                    <li key={b.key} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-3">
                      <img src={b.cover} alt="" className="h-20 w-14 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-accent">{b.daysAgo! < 0 ? "Coming soon" : "New release"} · {fmtDate(b.daysAgo!)}</p>
                        <p className="truncate font-semibold text-ink">{b.title}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "Reviews" && (
            <section className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
                <p className="font-serif text-4xl font-bold text-ink">{author.rating.toFixed(1)}</p>
                <div>
                  <div className="flex gap-0.5" aria-label={`${author.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={16} className={i <= Math.round(author.rating) ? "fill-brand text-brand" : "text-line"} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted">{author.ratingCount.toLocaleString("en-US")} ratings</p>
                </div>
              </div>
              {released.some((b) => b.rating !== undefined) ? (
                <ul className="space-y-3">
                  {released.filter((b) => b.rating !== undefined).map((b) => (
                    <li key={b.key} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-3">
                      <img src={b.cover} alt="" className="h-20 w-14 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{b.title}</p>
                        <p className="line-clamp-1 text-xs text-muted">{b.description}</p>
                      </div>
                      <p className="flex items-center gap-1 text-sm font-medium text-ink">
                        <Star size={14} className="fill-brand text-brand" /> {b.rating!.toFixed(1)}
                        <span className="text-xs font-normal text-muted">({compact(b.ratingCount!)})</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="No book ratings yet" text="Ratings for individual books will appear here." />
              )}
            </section>
          )}
        </div>

        {tab !== "About" && <AboutCard author={author} website={website} socials={socials} />}
      </div>
    </>
  );
}
