import { useState } from "react";
import { Bookmark, Heart } from "lucide-react";
import BookCard from "./BookCard";
import { useLibrary } from "../context/LibraryContext";
import { catalog } from "../data/catalog";
import { useRemoteVersion } from "../data/remote";
import { compact } from "../utils/format";

/** Books the signed-in user has saved or liked (authors can save and like books too, including their own). */
export default function SavedLiked() {
  useRemoteVersion(); // re-render when the catalog refreshes
  const { saved, liked, toggleSave, toggleLike } = useLibrary();
  const [view, setView] = useState<"saved" | "liked">("saved");
  const ids = view === "saved" ? saved : liked;
  const books = catalog.filter((b) => ids.has(b.id));
  const flip = view === "saved" ? toggleSave : toggleLike;

  return (
    <div>
      <div role="tablist" aria-label="Saved or liked" className="mb-4 inline-flex rounded-xl bg-bg p-1 text-sm">
        {([["saved", "Saved", Bookmark, saved.size], ["liked", "Liked", Heart, liked.size]] as const).map(([k, label, Icon, n]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 font-medium ${view === k ? "bg-brand/25 text-ink" : "text-muted hover:text-ink"}`}>
            <Icon size={14} /> {label} ({n})
          </button>
        ))}
      </div>

      {books.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="font-semibold text-ink">{view === "saved" ? "No saved books yet" : "No liked books yet"}</p>
          <p className="mt-1 text-sm text-muted">{view === "saved" ? "Tap the bookmark on a book to keep it here." : "Tap the heart on a book you love."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {books.map((b) => (
            <div key={b.id}>
              <BookCard book={{ id: b.id, title: b.title, author: b.author, cover: b.cover, likes: compact(b.likes), saves: compact(b.saves), discount: b.discount }} />
              <button onClick={() => flip(b.id)} className="mt-2 w-full rounded-lg border border-line py-1.5 text-xs font-semibold text-ink hover:bg-brand/10">
                {view === "saved" ? "Remove from saved" : "Unlike"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
