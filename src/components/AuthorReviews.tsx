import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CornerDownRight, MessageSquare, Star } from "lucide-react";
import Avatar from "./Avatar";
import { bookSlug } from "../data/allBooks";
import { deleteReply, loadReviewsOnBooks, saveReply, type Review } from "../data/remote";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** All reviews on the author's books in one place. Authors can only reply, never review their own books. */
export default function AuthorReviews({ books }: { books: { id: number; title: string }[] }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [filter, setFilter] = useState<"all" | "open">("all");
  const [bookId, setBookId] = useState<number | "all">("all");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const key = books.map((b) => b.id).join(",");
  const refresh = useCallback(async () => setReviews(await loadReviewsOnBooks(books)), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => {
    const list = reviews ?? [];
    const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
    return { total: list.length, avg, open: list.filter((r) => !r.reply).length };
  }, [reviews]);

  const shown = (reviews ?? []).filter((r) => (filter === "open" ? !r.reply : true) && (bookId === "all" || r.bookId === bookId));

  const send = async (r: Review) => {
    setError(null);
    try {
      await saveReply(r.id, text);
      setReplyingTo(null);
      setText("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your reply.");
    }
  };
  const remove = async (id: number) => {
    try {
      await deleteReply(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your reply.");
    }
  };

  if (reviews === null) return <p className="py-10 text-center text-sm text-muted">Loading reviews…</p>;

  if (books.length === 0 || reviews.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center">
        <MessageSquare size={28} className="mb-2 text-muted" />
        <p className="font-semibold text-ink">No reviews yet</p>
        <p className="mt-1 text-sm text-muted">When readers review your books, they'll show up here and you can reply.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          ["Reviews", String(stats.total)],
          ["Average", stats.avg.toFixed(1)],
          ["Need a reply", String(stats.open)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">{l}</p>
            <p className="mt-1 font-serif text-2xl font-bold text-ink">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter reviews" className="flex rounded-xl bg-bg p-1 text-sm">
          {([["all", "All"], ["open", "Needs reply"]] as const).map(([k, label]) => (
            <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)} className={`rounded-lg px-3 py-1.5 font-medium ${filter === k ? "bg-brand/25 text-ink" : "text-muted hover:text-ink"}`}>{label}</button>
          ))}
        </div>
        {books.length > 1 && (
          <select aria-label="Filter by book" value={bookId} onChange={(e) => setBookId(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-9 rounded-lg border border-line bg-bg px-3 text-sm text-ink">
            <option value="all">All books</option>
            {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        )}
      </div>

      {error && <p role="alert" className="text-xs text-error">{error}</p>}

      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Nothing here. You're all caught up.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
              {r.bookTitle && (
                <Link to={`/books/${bookSlug(r.bookTitle)}`} className="mb-2 block text-xs font-semibold text-accent hover:underline">On {r.bookTitle}</Link>
              )}
              <div className="flex items-center gap-3">
                {r.avatar ? <img src={r.avatar} alt="" className="h-9 w-9 rounded-full object-cover" /> : <Avatar name={r.name} className="h-9 w-9 text-xs" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
                  <p className="text-xs text-muted">{when(r.createdAt)}</p>
                </div>
                <div className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={r.rating >= n ? "fill-brand text-brand" : "text-line"} />)}
                </div>
              </div>
              {r.body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/90">{r.body}</p>}

              {r.reply && replyingTo !== r.id && (
                <div className="mt-3 flex gap-2 rounded-xl bg-bg p-3">
                  <CornerDownRight size={16} className="mt-0.5 shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">Your reply <span className="font-normal text-muted">· {when(r.reply.createdAt)}</span></p>
                    <p className="mt-1 whitespace-pre-line text-sm text-ink/90">{r.reply.body}</p>
                    <div className="mt-2 flex gap-4 text-xs text-muted">
                      <button type="button" className="hover:text-ink" onClick={() => { setReplyingTo(r.id); setText(r.reply!.body); }}>Edit</button>
                      <button type="button" className="hover:text-error" onClick={() => remove(r.reply!.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              )}

              {!r.reply && replyingTo !== r.id && (
                <button type="button" onClick={() => { setReplyingTo(r.id); setText(""); }} className="mt-3 text-xs font-semibold text-brand hover:underline">Reply</button>
              )}

              {replyingTo === r.id && (
                <div className="mt-3">
                  <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={2} autoFocus placeholder="Reply to this reader…" aria-label="Your reply" className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none" />
                  <div className="mt-2 flex gap-3">
                    <button type="button" onClick={() => send(r)} className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-[#14181F]">Post reply</button>
                    <button type="button" onClick={() => setReplyingTo(null)} className="text-xs text-muted hover:text-ink">Cancel</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
