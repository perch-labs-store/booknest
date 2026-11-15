import { useEffect, useState } from "react";

/** Background colours for the placeholder. One is picked per author from their id, so it is automatic and stays the same. */
const PALETTES = [
  "from-red-400 to-red-700",
  "from-emerald-400 to-green-700",
  "from-sky-400 to-blue-700",
  "from-orange-400 to-amber-700",
  "from-violet-400 to-purple-700",
  "from-pink-400 to-rose-700",
  "from-teal-400 to-cyan-700",
  "from-indigo-400 to-blue-800",
  "from-yellow-400 to-yellow-700",
];

function hash(s: string) {
  let h = 5381;
  for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h;
}

interface Props {
  /** The author's photo (a selfie or portrait). Without one, a coloured contact-style icon is drawn instead. */
  url?: string | null;
  /** Author id or name: decides the placeholder colour. */
  seed: string;
  /** What the picture is of, for screen readers. */
  alt?: string;
  /** Size and shape, e.g. "h-24 w-24 rounded-2xl". */
  className?: string;
}

export default function AuthorPhoto({ url, seed, alt = "", className = "h-24 w-24 rounded-2xl" }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (url && !failed) {
    return <img src={url} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`shrink-0 border border-line object-cover ${className}`} />;
  }
  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={`relative shrink-0 overflow-hidden border border-line bg-gradient-to-br ${PALETTES[hash(seed || "?") % PALETTES.length]} ${className}`}
    >
      {/* A head and shoulders, like an empty contact picture. */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" fill="white" fillOpacity="0.9" aria-hidden>
        <circle cx="50" cy="38" r="17" />
        <path d="M13 104c0-24 16-40 37-40s37 16 37 40z" />
      </svg>
    </div>
  );
}
