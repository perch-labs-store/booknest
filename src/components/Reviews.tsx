import { useCallback, useEffect, useState } from "react";
import { CornerDownRight, Star, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { deleteReply, deleteReview, loadRemote, loadReviews, saveReply, saveReview, type Review } from "../data/remote";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star size={26} className={(hover || value) >= n ? "fill-brand text-brand" : "text-muted"} />
        </button>
      ))}
    </div>
  );
}

const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Written reviews for a book: read them, add yours, change or delete it. All saved in Supabase. */
export default function Reviews({ bookId }: { bookId: number }) {
  const { signedIn } = useAuth();
  const authModal = useAuthModal();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const refresh = useCallback(async () => {
    const { reviews: list, isAuthor: author } = await loadReviews(bookId);
    setIsAuthor(author);
    setReviews(list);
    const mine = list.find((r) => r.mine);
    setRating(mine?.rating ?? 0);
    setBody(mine?.body ?? "");
  }, [bookId]);

  useEffect(() => {
    refresh();
  }, [refresh, signedIn]);

  const mine = reviews.find((r) => r.mine);

  const submit = async () => {
    if (!signedIn) return authModal.open("signin");
    if (!rating) return setError("Choose a star rating first.");
    setSaving(true);
    setError(null);
    try {
      await saveReview(bookId, rating, body);
      await refresh();
      await loadRemote(); // new average rating and count
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your review.");
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (r: Review) => {
    setError(null);
    try {
      await saveReply(r.id, replyText);
      setReplyingTo(null);
      setReplyText("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your reply.");
    }
  };

  const removeReply = async (id: number) => {
    try {
      await deleteReply(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your reply.");
    }
  };

  const remove = async (r: Review) => {
    setDeleting(null);
    try {
      await deleteReview(r.id);
      await refresh();
      await loadRemote();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your review.");
    }
  };

  return (
    <div className="space-y-5">
      {isAuthor ? (
        <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
          This is your book, so you can't review it. You can reply to what readers have written below.
        </p>
      ) : (
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="font-serif text-lg font-bold text-ink">{mine ? "Your review" : "Write a review"}</h3>
        <div className="mt-3">
          <StarPicker value={rating} onChange={(n) => { setRating(n); setError(null); }} />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="What did you think? (optional)"
          aria-label="Your review"
          className="mt-3 w-full resize-none rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none"
        />
        {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-[#14181F] transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Saving…" : mine ? "Update review" : signedIn ? "Post review" : "Sign in to review"}
          </button>
          {mine && (
            <button type="button" onClick={() => setDeleting(mine)} className="flex items-center gap-1.5 text-sm text-muted hover:text-error">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>
      )}

      {reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{isAuthor ? "No reviews yet." : "No reviews yet. Be the first to share what you think."}</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                {r.avatar ? <img src={r.avatar} alt="" className="h-9 w-9 rounded-full object-cover" /> : <Avatar name={r.name} className="h-9 w-9 text-xs" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{r.name}{r.mine && <span className="font-normal text-muted"> (you)</span>}</p>
                  <p className="text-xs text-muted">{when(r.createdAt)}</p>
                </div>
                <div className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={14} className={r.rating >= n ? "fill-brand text-brand" : "text-line"} />
                  ))}
                </div>
              </div>
              {r.body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/90">{r.body}</p>}

              {r.reply && replyingTo !== r.id && (
                <div className="mt-3 flex gap-2 rounded-xl bg-bg p-3">
                  <CornerDownRight size={16} className="mt-0.5 shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">Reply from the author <span className="font-normal text-muted">· {when(r.reply.createdAt)}</span></p>
                    <p className="mt-1 whitespace-pre-line text-sm text-ink/90">{r.reply.body}</p>
                    {isAuthor && (
                      <div className="mt-2 flex gap-4 text-xs text-muted">
                        <button type="button" className="hover:text-ink" onClick={() => { setReplyingTo(r.id); setReplyText(r.reply!.body); }}>Edit</button>
                        <button type="button" className="hover:text-error" onClick={() => removeReply(r.reply!.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isAuthor && !r.reply && replyingTo !== r.id && (
                <button type="button" onClick={() => { setReplyingTo(r.id); setReplyText(""); }} className="mt-3 text-xs font-semibold text-brand hover:underline">
                  Reply
                </button>
              )}

              {isAuthor && replyingTo === r.id && (
                <div className="mt-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    maxLength={1000}
                    rows={2}
                    autoFocus
                    placeholder="Reply to this reader…"
                    aria-label="Your reply"
                    className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                  />
                  <div className="mt-2 flex gap-3">
                    <button type="button" onClick={() => sendReply(r)} className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-[#14181F]">Post reply</button>
                    <button type="button" onClick={() => setReplyingTo(null)} className="text-xs text-muted hover:text-ink">Cancel</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {deleting && (
        <ConfirmModal
          danger
          title="Delete your review?"
          message="Your rating and review will be removed from this book."
          confirmLabel="Delete"
          onConfirm={() => remove(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
