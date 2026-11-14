import { useCallback, useEffect, useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { addPost, deletePost, loadPosts, type AuthorPost } from "../data/remote";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const MAX = 500;

/** Short news posts. With `canPost` the author gets a composer and delete buttons; everyone else just reads. */
export default function AuthorPosts({ authorId, canPost = false }: { authorId: string | null; canPost?: boolean }) {
  const [posts, setPosts] = useState<AuthorPost[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AuthorPost | null>(null);

  const refresh = useCallback(async () => {
    if (authorId) setPosts(await loadPosts(authorId));
  }, [authorId]);
  useEffect(() => { refresh(); }, [refresh]);

  const post = async () => {
    if (!authorId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addPost(authorId, text);
      setText("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post your update.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: AuthorPost) => {
    setDeleting(null);
    try {
      await deletePost(p.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete that post.");
    }
  };

  return (
    <div className="space-y-4">
      {canPost && (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-serif text-lg font-bold text-ink">Post an update</h3>
          <p className="mt-1 text-xs text-muted">Share news with your readers, like a launch date or a signing. Your followers get a notification.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX}
            rows={3}
            placeholder="What's new?"
            aria-label="Update text"
            className="mt-3 w-full resize-none rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none"
          />
          {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted">{text.length}/{MAX}</span>
            <button type="button" onClick={post} disabled={busy || !text.trim() || !authorId} className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-[#14181F] hover:brightness-110 disabled:opacity-60">
              {busy ? "Posting…" : "Post update"}
            </button>
          </div>
        </div>
      )}

      {posts === null ? (
        <p className="py-6 text-center text-sm text-muted">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center">
          <Megaphone size={26} className="mb-2 text-muted" />
          <p className="font-semibold text-ink">No posts yet</p>
          <p className="mt-1 text-sm text-muted">{canPost ? "Your first update will show up here." : "Posts from this author will show up here."}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-accent">{when(p.createdAt)}</p>
                {canPost && (
                  <button onClick={() => setDeleting(p)} aria-label="Delete post" className="text-muted hover:text-error"><Trash2 size={14} /></button>
                )}
              </div>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink/90">{p.body}</p>
            </li>
          ))}
        </ul>
      )}

      {deleting && (
        <ConfirmModal danger title="Delete this post?" message="It will be removed from your page." confirmLabel="Delete" onConfirm={() => remove(deleting)} onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
}
