import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BadgeCheck, BarChart3, BookOpen, Camera, Pin, Link as LinkIcon, LogIn, MapPin, Pencil, Plus, Settings as SettingsIcon, Trash2 } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import { deleteBook, loadRemote } from "../data/remote";
import Avatar from "../components/Avatar";
import BookCard from "../components/BookCard";
import EditProfileModal from "../components/EditProfileModal";
import SocialLinks from "../components/SocialLinks";
import FeaturedBook from "../components/FeaturedBook";
import AuthorReviews from "../components/AuthorReviews";
import SavedLiked from "../components/SavedLiked";
import AuthorPosts from "../components/AuthorPosts";
import FollowingList from "../components/FollowingList";
import ShareProfile from "../components/ShareProfile";
import { catalog } from "../data/catalog";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { initialMyBooks } from "../data/profile";
import { compact } from "../utils/format";

const TABS = ["My Books", "Reviews", "Updates", "Saved & Liked", "Following", "About", "Stats"] as const;
type Tab = (typeof TABS)[number];

const IMG_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function ProfileContent() {
  const { profile, authorId, update, avatarUrl, prefs, updateAvatar } = useProfile();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: number; title: string } | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);
  const from = (useLocation().state ?? {}) as { tab?: Tab; edit?: boolean };
  const [tab, setTab] = useState<Tab>(from.tab ?? "My Books");
  const [editing, setEditing] = useState(Boolean(from.edit));
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const books = initialMyBooks;

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    if (!IMG_TYPES.includes(file.type)) return setAvatarError("Use a PNG, JPG or WEBP image.");
    if (file.size > MAX_BYTES) return setAvatarError("Image must be 5MB or smaller.");
    setAvatarError("");
    setUploading(true);
    const err = await updateAvatar(file);
    setUploading(false);
    if (err) setAvatarError(err);
  };

  const featured = profile.featuredBookId ? catalog.find((b) => b.id === profile.featuredBookId) : undefined;
  const pin = async (id: number | null) => {
    setBookError(null);
    const err = await update({ featuredBookId: id });
    if (err) setBookError(err);
  };

  const published = books.filter((b) => b.status === "Published");
  const total = (k: "likes" | "saves") => books.reduce((s, b) => s + b[k], 0);
  const counts: Record<Tab, string> = {
    "My Books": ` (${books.length})`,
    Reviews: "",
    Updates: "",
    "Saved & Liked": "",
    Following: ` (${profile.following})`,
    About: "",
    Stats: "",
  };

  return (
    <>
      {/* Top bar: username + settings */}
      <div className="mb-5 flex items-center justify-between">
        <p className="truncate text-base font-semibold text-ink">{profile.username ? `@${profile.username}` : profile.name || "My profile"}</p>
        <Link to="/settings" aria-label="Settings" title="Settings" className="rounded-full p-2 text-ink transition hover:bg-brand/10">
          <SettingsIcon size={22} />
        </Link>
      </div>

      {/* Profile header */}
      <section>
        <div className="flex items-center gap-5 sm:gap-8">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${profile.name} profile photo`} className="h-24 w-24 rounded-full object-cover sm:h-32 sm:w-32" />
            ) : (
              <Avatar name={profile.name || "?"} className="h-24 w-24 text-4xl sm:h-32 sm:w-32 sm:text-5xl" />
            )}
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile photo"
              disabled={uploading}
              className="absolute bottom-0 right-0 rounded-full border border-line bg-surface p-1.5 text-ink hover:bg-brand/20"
            >
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept={IMG_TYPES.join(",")} hidden onChange={(e) => { pickAvatar(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 text-lg font-bold text-ink sm:text-xl">
              <span className="truncate">{profile.name || "Your name"}</span>
              {profile.verified && <BadgeCheck size={18} className="shrink-0 text-info" aria-label="Verified" />}
            </h1>
            <p className="truncate text-sm text-muted">{profile.username ? `@${profile.username}` : "Add a username in Edit Profile"}</p>
            <dl className="mt-3 flex gap-6 sm:gap-10">
              {[
                ["books", String(books.length)],
                ["followers", prefs.showFollowers ? compact(profile.followers) : "—"],
                ["following", String(profile.following)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dd className="text-lg font-bold leading-tight text-ink">{value}</dd>
                  <dt className="text-xs text-muted sm:text-sm">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {avatarError && <p role="alert" className="mt-2 text-xs text-error">{avatarError}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-line bg-surface py-3 text-sm font-semibold text-ink transition hover:bg-brand/10"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setTab("Stats")}
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-semibold text-ink transition hover:bg-brand/10"
          >
            <BarChart3 size={16} /> Analytics
          </button>
        </div>

        {profile.bio && <p className="mt-4 max-w-2xl text-sm text-ink/90">{profile.bio}</p>}
        {profile.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.genres.map((g) => <span key={g} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink/90">{g}</span>)}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
          {profile.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {profile.location}</span>}
          {profile.website && (
            <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:underline">
              <LinkIcon size={14} /> {profile.website}
            </a>
          )}
          <ShareProfile authorId={authorId} name={profile.name} className="flex items-center gap-1.5 text-accent hover:underline" />
        </div>
        <SocialLinks links={profile.socials} className="mt-3" />
      </section>

      {featured && <div className="mt-6"><FeaturedBook book={featured} onUnpin={() => pin(null)} /></div>}

      {/* Tabs */}
      <div role="tablist" className="no-scrollbar mb-6 mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.filter((t) => t !== "Stats" || tab === "Stats").map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={t === tab}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              t === tab ? "border-b-2 border-brand bg-brand/20 text-ink" : "text-muted hover:bg-brand/10 hover:text-ink"
            }`}
          >
            {t}{counts[t]}
          </button>
        ))}
      </div>

      {tab === "My Books" && books.length === 0 && (
        <div className="flex flex-col items-center py-14 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-surface text-muted"><BookOpen size={32} /></span>
          <p className="mt-5 font-semibold text-ink">No books yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">You haven't added any books. Share your first one with readers!</p>
          <Link to="/add-book" className="mt-5 flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90">
            <Plus size={16} /> Add Book
          </Link>
        </div>
      )}

      {tab === "My Books" && books.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {bookError && <p role="alert" className="col-span-full rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{bookError}</p>}
          {books.map((b) => (
            <div key={b.id}>
              <BookCard
                badge={b.status === "Draft" ? "Draft" : undefined}
                book={{ id: b.id, title: b.title, author: profile.name, cover: b.cover, likes: compact(b.likes), saves: compact(b.saves) }}
              />
              <div className="mt-2 flex gap-2">
                <Link to={`/add-book?edit=${b.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line py-1.5 text-xs font-semibold text-ink hover:bg-brand/10">
                  <Pencil size={13} /> Edit
                </Link>
                {b.status === "Published" && (
                  <button
                    onClick={() => pin(profile.featuredBookId === b.id ? null : b.id)}
                    aria-pressed={profile.featuredBookId === b.id}
                    aria-label={profile.featuredBookId === b.id ? `Unpin ${b.title}` : `Feature ${b.title} on your page`}
                    title={profile.featuredBookId === b.id ? "Unpin from your page" : "Feature on your page"}
                    className={`rounded-lg border px-2.5 py-1.5 ${profile.featuredBookId === b.id ? "border-brand bg-brand/25 text-ink" : "border-line text-muted hover:text-ink"}`}
                  >
                    <Pin size={14} />
                  </button>
                )}
                <button
                  onClick={() => setToDelete({ id: b.id, title: b.title })}
                  aria-label={`Delete ${b.title}`}
                  className="rounded-lg border border-line px-2.5 py-1.5 text-muted hover:border-error/50 hover:text-error"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <Link
            to="/add-book"
            className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-sm font-semibold text-ink transition hover:border-brand hover:bg-brand/10"
          >
            <Plus size={26} className="text-accent" /> Add Book
          </Link>
        </div>
      )}

      {tab === "Reviews" && <AuthorReviews books={published.map((b) => ({ id: b.id, title: b.title }))} />}

      {tab === "Updates" && <AuthorPosts authorId={authorId} canPost />}

      {tab === "Saved & Liked" && <SavedLiked />}

      {tab === "Following" && <FollowingList />}

      {tab === "About" && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-serif text-xl font-bold text-ink">About {profile.name || "you"}</h2>
          {profile.about ? (
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink/90">{profile.about}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Tell readers your story: where you write from, what inspires your books, what to read first.{" "}
              <button onClick={() => setEditing(true)} className="font-medium text-accent hover:underline">Add your story</button>
            </p>
          )}
        </section>
      )}

      {tab === "Stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ["Total likes", compact(total("likes"))],
              ["Total saves", compact(total("saves"))],
              ["Published books", String(published.length)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 font-serif text-3xl font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-ink">Top books by likes</h3>
            <ol className="space-y-3">
              {[...published].sort((a, b) => b.likes - a.likes).slice(0, 5).map((b, i, arr) => (
                <li key={b.id} className="flex items-center gap-3">
                  <span className="w-5 text-sm text-muted">{i + 1}</span>
                  <img src={b.cover} alt="" className="h-12 w-9 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{b.title}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${arr[0].likes ? (b.likes / arr[0].likes) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted">{compact(b.likes)} likes</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmModal
          danger
          title={`Delete "${toDelete.title}"?`}
          message="This removes the book, its buy links, likes and reviews. This can't be undone."
          confirmLabel="Delete book"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            const target = toDelete;
            setToDelete(null);
            try {
              await deleteBook(target.id);
              await loadRemote();
            } catch (e) {
              setBookError(e instanceof Error ? e.message : "Could not delete the book.");
            }
          }}
        />
      )}

      {editing && (
        <EditProfileModal
          profile={profile}
          error={saveError}
          onClose={() => {
            setEditing(false);
            setSaveError(null);
          }}
          onSave={async (patch) => {
            setSaveError(null);
            const err = await update(patch);
            if (err) setSaveError(err);
            else setEditing(false);
          }}
        />
      )}
    </>
  );
}

/** Signed-out visitors get the sign-in modal instead of a profile. */
export default function Profile() {
  const { signedIn, loading } = useAuth();
  const auth = useAuthModal();

  useEffect(() => {
    if (!loading && !signedIn) auth.open("signin");
  }, [loading, signedIn, auth]);

  if (loading) return null;
  if (signedIn) return <ProfileContent />;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <LogIn size={36} className="mb-3 text-muted" />
      <h1 className="font-serif text-2xl font-bold text-ink">Sign in to view your profile</h1>
      <p className="mt-1 text-sm text-muted">Log in or create an account to manage your profile and books.</p>
      <button
        onClick={() => auth.open("signin")}
        className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-[#14181F] transition hover:brightness-110"
      >
        Sign in
      </button>
    </div>
  );
}
