const palettes = [
  "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-700",
  "from-sky-400 to-indigo-600",
  "from-emerald-400 to-teal-700",
  "from-violet-400 to-purple-700",
  "from-yellow-400 to-amber-700",
];

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

interface Props {
  name: string;
  className?: string; // size + text size, e.g. "h-16 w-16 text-xl"
}

export default function Avatar({ name, className = "h-12 w-12 text-base" }: Props) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-serif font-bold text-white ring-2 ring-line ${
        palettes[hash(name) % palettes.length]
      } ${className}`}
    >
      {initials}
    </div>
  );
}
