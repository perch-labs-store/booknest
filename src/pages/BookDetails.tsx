import { useEffect, useMemo, useState } from "react";
import Reviews from "../components/Reviews";
import { useLibrary } from "../context/LibraryContext";
import { getCachedStory, loadBookStory, useRemoteVersion, type BookStory } from "../data/remote";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Bookmark, BookX, Check, Heart, Share2, ShoppingCart, Star } from "lucide-react";
import Avatar from "../components/Avatar";
import AuthorPhoto from "../components/AuthorPhoto";
import AuthorLink from "../components/AuthorLink";
import GenreTag from "../components/GenreTag";
import { genresOf, getBookBySlug, getSimilarBooks, type BookDetail } from "../data/allBooks";
import { getAuthorByName } from "../data/authorBooks";
import { FORMAT_LABELS, type BookLink } from "../data/links";
import { activeDiscount, formatEndDate } from "../data/discount";
import BuyModal from "../components/BuyModal";
import { compact } from "../utils/format";

const TABS = ["About", "Reviews", "Similar Books"] as const;
type Tab = (typeof TABS)[number];

const DAY = 86_400_000;
const fmtDate = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * DAY).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? "fill-brand text-brand" : "text-line"} />
      ))}
    </span>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}

function DetailsCard({ book }: { book: BookDetail }) {
  const rows: [string, string][] = [];
  if (book.formats?.length) rows.push(["Format", book.formats.join(", ")]);
  if (book.daysAgo !== undefined) rows.push([book.daysAgo < 0 ? "Releases" : "Published", fmtDate(book.daysAgo)]);
  if (book.draft) rows.push(["Status", "Draft"]);
  if (book.likes !== undefined) rows.push(["Likes", compact(book.likes)]);
  if (book.saves !== undefined) rows.push(["Saves", compact(book.saves)]);

  return (
    <aside className="h-fit rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-serif text-lg font-bold text-ink">Book Details</h2>
      {rows.length ? (
        <dl className="mt-3 divide-y divide-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted">No extra details available for this book yet.</p>
      )}
    </aside>
  );
}

function AuthorCard({ name, about }: { name: string; about?: string }) {
  const author = getAuthorByName(name);
  const [open, setOpen] = useState(false);
  const text = (about ?? "").trim();
  const long = text.length > 260;
  return (
    <aside className="h-fit rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-serif text-lg font-bold text-ink">About the Author</h2>
      {/* The author's own photo (selfie / portrait), or a coloured contact-style icon when they haven't added one. */}
      <AuthorPhoto
        url={author?.photoUrl}
        seed={author?.id ?? name}
        alt={`${name}, author`}
        className="mt-4 aspect-square w-full max-w-[15rem] rounded-2xl"
      />
      <div className="mt-4 min-w-0">
        <p className="flex items-center gap-1 font-semibold text-ink">
          <span className="truncate">{name}</span>
          {author?.verified && <BadgeCheck size={15} className="shrink-0 fill-info text-white" aria-label="Verified" />}
        </p>
        {author ? (
          <p className="text-xs text-muted">{author.books} Books · {compact(author.followers)} Followers</p>
        ) : (
          <p className="text-xs text-muted">Author</p>
        )}
      </div>
      {text && (
        <>
          <p className={`mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/90 ${long && !open ? "line-clamp-5" : ""}`}>{text}</p>
          {long && (
            <button onClick={() => setOpen((v) => !v)} className="mt-1.5 text-sm font-semibold text-accent hover:underline">
              {open ? "Show Less" : "Read More"}
            </button>
          )}
        </>
      )}
      {author && (
        <Link
          to={`/authors/${author.id}`}
          className="mt-4 block rounded-full border border-brand px-4 py-2 text-center text-sm font-semibold text-ink transition hover:bg-brand/15"
        >
          View Profile
        </Link>
      )}
    </aside>
  );
}

export default function BookDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  useRemoteVersion(); // re-render when likes, ratings or books change in the database
  const { liked, saved, toggleLike, toggleSave } = useLibrary();
  const book = getBookBySlug(slug);
  const [tab, setTab] = useState<Tab>("About");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [buying, setBuying] = useState(false);

  const similar = useMemo(() => (book ? getSimilarBooks(book) : []), [book]);

  // The long description and the author text are fetched for this one book only (the home page never needs them).
  const bookId = book?.id;
  const [story, setStory] = useState<BookStory | undefined>(() => getCachedStory(bookId));
  useEffect(() => {
    setStory(getCachedStory(bookId));
    if (bookId === undefined) return;
    let cancelled = false;
    loadBookStory(bookId).then((st) => {
      if (!cancelled && st) setStory(st);
    });
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (!book) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <BookX size={36} className="mb-3 text-muted" />
        <h1 className="font-serif text-2xl font-bold text-ink">Book not found</h1>
        <Link to="/search" className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-[#14181F]">Search books</Link>
      </div>
    );
  }

  const genres = genresOf(book);
  const links: BookLink[] = book.links ?? [];
  const discount = activeDiscount(book.discount);
  const formatsOnSale = [...new Set(links.map((l) => l.format))].map((f) => FORMAT_LABELS[f]).join(" · ");
  const author = getAuthorByName(book.author);
  // Short description: top of the page. Full description: the story. Books saved before the split only have the short one.
  const desc = book.description ?? "";
  const story_ = story?.longDescription.trim() || desc;
  const longDesc = story_.length > 700;
  const paragraphs = story_.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const aboutAuthor = story?.aboutAuthor.trim() || author?.about?.trim() || author?.bio?.trim() || "";

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable – nothing to do */
    }
  };

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={15} /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Hero */}
        <section className="flex flex-col gap-6 sm:flex-row">
          <img
            src={book.cover}
            alt={`${book.title} cover`}
            className="aspect-[3/4] w-44 shrink-0 self-start rounded-xl border border-line object-cover shadow-lg sm:w-52"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">{book.title}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              by
              <Avatar name={book.author} className="h-6 w-6 text-[10px]" />
              <AuthorLink name={book.author} className="font-semibold text-ink" />
              {author?.verified && <BadgeCheck size={15} className="fill-info text-white" aria-label="Verified" />}
            </p>

            {genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {genres.map((g) => (
                  <GenreTag key={g} name={g} className="rounded-full border border-line px-3 py-1 text-xs text-ink/90" />
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {book.rating !== undefined ? (
                <>
                  <Stars value={book.rating} />
                  <span className="font-bold text-ink">{book.rating.toFixed(1)}</span>
                  <span className="text-muted">({(book.ratingCount ?? 0).toLocaleString("en-US")} reviews)</span>
                </>
              ) : (
                <span className="text-muted">Not rated yet</span>
              )}
            </div>

            {desc && <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-ink">{desc}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {links.length > 0 ? (
                <button
                  onClick={() => setBuying(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-[#14181F] transition hover:brightness-110"
                >
                  <ShoppingCart size={16} /> Buy{discount && ` · ${discount.percent}% off`}
                </button>
              ) : (
                <p className="text-sm text-muted">The author hasn't added any buy links for this book yet.</p>
              )}
              {book.id !== undefined && (
                <>
                  <button
                    onClick={() => toggleLike(book.id!)}
                    aria-pressed={liked.has(book.id)}
                    aria-label={liked.has(book.id) ? "Unlike this book" : "Like this book"}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-3 text-sm transition hover:bg-brand/15 ${liked.has(book.id) ? "border-error/50 text-error" : "border-line text-ink"}`}
                  >
                    <Heart size={16} className={liked.has(book.id) ? "fill-current" : ""} /> {compact(book.likes ?? 0)}
                  </button>
                  <button
                    onClick={() => toggleSave(book.id!)}
                    aria-pressed={saved.has(book.id)}
                    aria-label={saved.has(book.id) ? "Remove from saved" : "Save this book"}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-3 text-sm transition hover:bg-brand/15 ${saved.has(book.id) ? "border-brand text-accent" : "border-line text-ink"}`}
                  >
                    <Bookmark size={16} className={saved.has(book.id) ? "fill-current" : ""} /> {compact(book.saves ?? 0)}
                  </button>
                </>
              )}
              <button
                onClick={share}
                aria-label="Copy link to this book"
                title={copied ? "Link copied" : "Share"}
                className="rounded-xl border border-line p-3 text-ink transition hover:bg-brand/15"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
              </button>
            </div>
            {links.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Available as {formatsOnSale}
                {discount?.endsOn && ` · Offer ends ${formatEndDate(discount.endsOn)}`}
              </p>
            )}
          </div>
        </section>

        <DetailsCard book={book} />

        {/* Tabs + content */}
        <div className="min-w-0">
          <div role="tablist" className="no-scrollbar mb-5 flex gap-1 overflow-x-auto border-b border-line">
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
                {t}{t === "Reviews" && book.ratingCount ? ` (${book.ratingCount.toLocaleString("en-US")})` : ""}
              </button>
            ))}
          </div>

          {tab === "About" && (
            <section>
              <h2 className="font-serif text-xl font-bold text-ink">About This Book</h2>
              {story_ ? (
                <>
                  <div className={`mt-2 space-y-3 text-sm leading-relaxed text-ink/90 ${longDesc && !expanded ? "max-h-52 overflow-hidden [mask-image:linear-gradient(to_bottom,black_65%,transparent)]" : ""}`}>
                    {paragraphs.map((para, k) => (
                      <p key={k} className="whitespace-pre-line">{para}</p>
                    ))}
                  </div>
                  {longDesc && (
                    <button onClick={() => setExpanded((v) => !v)} className="mt-2 text-sm font-semibold text-accent hover:underline">
                      {expanded ? "Show Less" : "Show More"}
                    </button>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">A description for this book hasn't been added yet.</p>
              )}
            </section>
          )}

          {tab === "Reviews" &&
            (book.id !== undefined ? (
              <div className="space-y-4">
                {book.rating !== undefined && book.rating > 0 && (
                  <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
                    <p className="font-serif text-4xl font-bold text-ink">{book.rating.toFixed(1)}</p>
                    <div>
                      <Stars value={book.rating} />
                      <p className="mt-1 text-xs text-muted">{(book.ratingCount ?? 0).toLocaleString("en-US")} reviews</p>
                    </div>
                  </div>
                )}
                <Reviews bookId={book.id} />
              </div>
            ) : (
              <Empty title="No reviews yet" text="Reviews open once this book is saved on BookNest." />
            ))}

          {tab === "Similar Books" &&
            (similar.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {similar.map((b) => (
                  <Link key={b.slug} to={`/books/${b.slug}`} className="group">
                    <div className="aspect-[3/4] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
                      <img src={b.cover} alt={`${b.title} cover`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                    <h3 className="mt-2.5 truncate text-sm font-semibold text-ink">{b.title}</h3>
                    <p className="truncate text-xs text-muted">{b.author}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      {b.rating !== undefined ? (
                        <><Star size={12} className="fill-brand text-brand" /> {b.rating.toFixed(1)}</>
                      ) : b.likes !== undefined ? (
                        <><Heart size={12} /> {compact(b.likes)}</>
                      ) : null}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty title="No similar books yet" text="Books in the same genre will appear here." />
            ))}
        </div>

        <AuthorCard name={book.author} about={aboutAuthor} />
      </div>
      {buying && <BuyModal title={book.title} links={links} discount={discount} onClose={() => setBuying(false)} />}
    </>
  );
}
