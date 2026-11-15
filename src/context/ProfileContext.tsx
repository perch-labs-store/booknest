import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialProfile, type Profile } from "../data/profile";
import { DEFAULT_PREFS, loadMyProfile, saveAvatar, saveBanner, savePhoto, saveMyPrefs, saveMyProfile, type Prefs } from "../data/remote";
import { useAuth } from "./AuthContext";

interface ProfileValue {
  profile: Profile;
  /** The signed-in author's id (URL slug), or null until loaded. */
  authorId: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  /** Optional author photo shown under "About the Author". */
  photoUrl: string | null;
  prefs: Prefs;
  /** Saves profile edits to Supabase. Resolves to an error message, or null when it worked. */
  update: (patch: Partial<Profile>) => Promise<string | null>;
  updatePrefs: (patch: Partial<Prefs>) => void;
  /** Uploads a new profile photo. Resolves to an error message, or null when it worked. */
  updateAvatar: (file: File) => Promise<string | null>;
  /** Uploads a new author photo, or removes it with null. Resolves to an error message, or null when it worked. */
  updatePhoto: (file: File | null) => Promise<string | null>;
  /** Uploads a new cover banner, or removes it with null. Resolves to an error message, or null when it worked. */
  updateBanner: (file: File | null) => Promise<string | null>;
  /** True right after sign-up, until the welcome prompt is saved or skipped. */
  needsWelcome: boolean;
  finishWelcome: () => void;
}

const ProfileContext = createContext<ProfileValue | null>(null);

const messageOf = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Please try again.");

/** The signed-in author's profile. Loaded from, and saved to, Supabase. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { signedIn, loading } = useAuth();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [needsWelcome, setNeedsWelcome] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!signedIn) {
      setProfile(initialProfile);
      setAvatarUrl(null);
      setBannerUrl(null);
      setPhotoUrl(null);
      setAuthorId(null);
      setPrefs(DEFAULT_PREFS);
      setNeedsWelcome(false);
      return;
    }
    let cancelled = false;
    loadMyProfile().then((mine) => {
      if (cancelled || !mine) return;
      setProfile(mine.profile);
      setAvatarUrl(mine.avatarUrl);
      setBannerUrl(mine.bannerUrl);
      setPhotoUrl(mine.photoUrl);
      setAuthorId(mine.authorId);
      setPrefs(mine.prefs);
      setNeedsWelcome(mine.isNew);
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn, loading]);

  const update = useCallback(async (patch: Partial<Profile>) => {
    try {
      await saveMyProfile(patch);
      setProfile((p) => ({ ...p, ...patch }));
      return null;
    } catch (e) {
      return messageOf(e);
    }
  }, []);

  const updatePrefs = useCallback(
    (patch: Partial<Prefs>) => {
      const next = { ...prefs, ...patch };
      setPrefs(next);
      saveMyPrefs(next).catch((e) => console.error("[BookNest] Could not save settings:", messageOf(e)));
    },
    [prefs],
  );

  const updateAvatar = useCallback(async (file: File) => {
    try {
      setAvatarUrl(await saveAvatar(file));
      return null;
    } catch (e) {
      return messageOf(e);
    }
  }, []);

  const updatePhoto = useCallback(async (file: File | null) => {
    try {
      setPhotoUrl(await savePhoto(file));
      return null;
    } catch (e) {
      return messageOf(e);
    }
  }, []);

  const updateBanner = useCallback(async (file: File | null) => {
    try {
      setBannerUrl(await saveBanner(file));
      return null;
    } catch (e) {
      return messageOf(e);
    }
  }, []);

  const finishWelcome = useCallback(() => {
    setNeedsWelcome(false);
    updatePrefs({ onboarded: true });
  }, [updatePrefs]);

  const value = useMemo(
    () => ({ profile, authorId, avatarUrl, bannerUrl, photoUrl, prefs, update, updatePrefs, updateAvatar, updatePhoto, updateBanner, needsWelcome, finishWelcome }),
    [profile, authorId, avatarUrl, bannerUrl, photoUrl, prefs, update, updatePrefs, updateAvatar, updatePhoto, updateBanner, needsWelcome, finishWelcome],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}
