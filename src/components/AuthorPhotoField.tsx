import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import AuthorPhoto from "./AuthorPhoto";
import { useProfile } from "../context/ProfileContext";

const IMG_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

/** Lets the signed-in author add, change or remove their author photo (optional). */
export default function AuthorPhotoField({ className = "" }: { className?: string }) {
  const { profile, authorId, photoUrl, updatePhoto } = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (file: File | null) => {
    setError("");
    setBusy(true);
    const err = await updatePhoto(file);
    setBusy(false);
    if (err) setError(err);
  };
  const pick = (file?: File) => {
    if (!file) return;
    if (!IMG_TYPES.includes(file.type)) return setError("Use a PNG, JPG or WEBP image.");
    if (file.size > MAX_BYTES) return setError("Image must be 8MB or smaller.");
    run(file);
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <AuthorPhoto url={photoUrl} seed={authorId || profile.name} alt="Your author photo" className="h-20 w-20 rounded-2xl" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">
          Author Photo <span className="font-normal text-muted">(optional)</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">A selfie or friendly portrait, shown under "About the Author" on your book pages. Skip it and a coloured icon is used.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-brand/10 disabled:opacity-60"
          >
            <Camera size={13} /> {busy ? "Saving…" : photoUrl ? "Change photo" : "Add photo"}
          </button>
          {photoUrl && (
            <button
              type="button"
              onClick={() => run(null)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-brand/10 hover:text-ink disabled:opacity-60"
            >
              <Trash2 size={13} /> Remove
            </button>
          )}
        </div>
        {error && <p role="alert" className="mt-1.5 text-xs text-error">{error}</p>}
        <input ref={fileRef} type="file" accept={IMG_TYPES.join(",")} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
    </div>
  );
}
