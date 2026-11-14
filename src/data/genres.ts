import fantasyImg from "../assets/genres/fantasy.png";
import romanceImg from "../assets/genres/romance.png";
import thrillerImg from "../assets/genres/thriller.png";
import sciFiImg from "../assets/genres/sci-fi.png";
import selfHelpImg from "../assets/genres/self-help.png";
import nonFictionImg from "../assets/genres/non-fiction.png";
import mysteryImg from "../assets/genres/mystery.png";
import businessImg from "../assets/genres/business.png";
import { Briefcase, Castle, Fingerprint, Heart, Landmark, Rocket, Siren, Sprout, type LucideIcon } from "lucide-react";

export interface Genre {
  slug: string;
  name: string;
  icon: LucideIcon;
  /** Cover image for the genre tile (the genre name is baked into the artwork). */
  image: string;
  /** Tailwind gradient classes. Tiles stay dark in both themes so white text is always readable. */
  gradient: string;
}

export const genres: Genre[] = [
  { slug: "fantasy", image: fantasyImg, name: "Fantasy", icon: Castle, gradient: "from-orange-500 via-rose-700 to-indigo-950" },
  { slug: "romance", image: romanceImg, name: "Romance", icon: Heart, gradient: "from-pink-500 via-rose-700 to-purple-950" },
  { slug: "thriller", image: thrillerImg, name: "Thriller", icon: Siren, gradient: "from-sky-700 via-slate-800 to-slate-950" },
  { slug: "sci-fi", image: sciFiImg, name: "Sci-Fi", icon: Rocket, gradient: "from-blue-600 via-indigo-800 to-slate-950" },
  { slug: "self-help", image: selfHelpImg, name: "Self-Help", icon: Sprout, gradient: "from-amber-500 via-orange-700 to-stone-900" },
  { slug: "non-fiction", image: nonFictionImg, name: "Non-Fiction", icon: Landmark, gradient: "from-emerald-600 via-teal-800 to-slate-950" },
  { slug: "mystery", image: mysteryImg, name: "Mystery", icon: Fingerprint, gradient: "from-zinc-500 via-zinc-700 to-zinc-950" },
  { slug: "business", image: businessImg, name: "Business", icon: Briefcase, gradient: "from-yellow-600 via-orange-800 to-slate-950" },
];
