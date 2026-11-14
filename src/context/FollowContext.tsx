import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadMyFollows, setFollow } from "../data/remote";
import { useAuth } from "./AuthContext";
import { useAuthModal } from "./AuthModalContext";

interface FollowValue {
  following: Set<string>;
  toggle: (id: string) => void;
}

const FollowContext = createContext<FollowValue | null>(null);

/** Who the signed-in user follows, saved to Supabase and shared between the Top Authors list and author pages. */
export function FollowProvider({ children }: { children: ReactNode }) {
  const { signedIn, loading } = useAuth();
  const authModal = useAuthModal();
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (loading) return;
    if (!signedIn) return setFollowing(new Set());
    let cancelled = false;
    loadMyFollows().then((set) => !cancelled && setFollowing(set));
    return () => {
      cancelled = true;
    };
  }, [signedIn, loading]);

  const toggle = useCallback(
    (id: string) => {
      if (!signedIn) return authModal.open("signin");
      const nowFollowing = !following.has(id);
      const apply = (on: boolean) =>
        setFollowing((prev) => {
          const next = new Set(prev);
          if (on) next.add(id);
          else next.delete(id);
          return next;
        });
      apply(nowFollowing); // instant feedback...
      setFollow(id, nowFollowing).catch((e) => {
        console.error("[BookNest] Could not save follow:", e);
        apply(!nowFollowing); // ...undone if it did not save
      });
    },
    [following, signedIn, authModal],
  );

  const value = useMemo(() => ({ following, toggle }), [following, toggle]);
  return <FollowContext.Provider value={value}>{children}</FollowContext.Provider>;
}

export function useFollow() {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error("useFollow must be used inside <FollowProvider>");
  return ctx;
}
