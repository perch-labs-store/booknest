import { Link } from "react-router-dom";
import AuthorCard from "./AuthorCard";
import { useFollow } from "../context/FollowContext";
import { authors } from "../data/authors";
import { useRemoteVersion } from "../data/remote";

/** Authors the signed-in user follows. */
export default function FollowingList() {
  useRemoteVersion(); // re-render when the author list refreshes
  const { following, toggle } = useFollow();
  const list = authors.filter((a) => following.has(a.id));

  if (list.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="font-semibold text-ink">You're not following anyone yet</p>
        <p className="mt-1 text-sm text-muted">Follow authors to get their news and new releases.</p>
        <Link to="/top-authors" className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-[#14181F]">Browse authors</Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {list.map((a) => <AuthorCard key={a.id} author={a} following onToggle={() => toggle(a.id)} />)}
    </div>
  );
}
