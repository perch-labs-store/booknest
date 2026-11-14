import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadMyLibrary, loadRemote, setBookFlag } from "../data/remote";
import { useAuth } from "./AuthContext";
import { useAuthModal } from "./AuthModalContext";

interface LibraryValue {
  liked: Set<number>;
  saved: Set<number>;
  toggleLike: (bookId: number) => void;
  toggleSave: (bookId: number) => void;
}

const LibraryContext = createContext<LibraryValue | null>(null);

/** Which books the signed-in user has liked and saved. Stored in Supabase; counts update from the database. */
export function LibraryProvider({ children }: { children: ReactNode }) {
  const { signedIn, loading } = useAuth();
  const authModal = useAuthModal();
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (loading) return;
    if (!signedIn) {
      setLiked(new Set());
      setSaved(new Set());
      return;
    }
    let cancelled = false;
    loadMyLibrary().then((lib) => {
      if (cancelled) return;
      setLiked(lib.likes);
      setSaved(lib.saves);
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn, loading]);

  const flip = useCallback(
    (kind: "like" | "save", bookId: number) => {
      if (!signedIn) return authModal.open("signin");
      const set = kind === "like" ? liked : saved;
      const setter = kind === "like" ? setLiked : setSaved;
      const on = !set.has(bookId);
      const apply = (value: boolean) =>
        setter((prev) => {
          const next = new Set(prev);
          if (value) next.add(bookId);
          else next.delete(bookId);
          return next;
        });
      apply(on); // instant feedback, undone if it can't be saved
      setBookFlag(kind, bookId, on)
        .then(() => loadRemote()) // refresh the like / save counts
        .catch((e) => {
          console.error("[BookNest] Could not save:", e);
          apply(!on);
        });
    },
    [signedIn, authModal, liked, saved],
  );

  const value = useMemo(
    () => ({ liked, saved, toggleLike: (id: number) => flip("like", id), toggleSave: (id: number) => flip("save", id) }),
    [liked, saved, flip],
  );
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return ctx;
}
