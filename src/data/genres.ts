import fantasyImg from "../assets/genres/fantasy.png";
import romanceImg from "../assets/genres/romance.png";
import thrillerImg from "../assets/genres/thriller.png";
import sciFiImg from "../assets/genres/sci-fi.png";
import selfHelpImg from "../assets/genres/self-help.png";
import nonFictionImg from "../assets/genres/non-fiction.png";
import mysteryImg from "../assets/genres/mystery.png";
import businessImg from "../assets/genres/business.png";
import bedtimeStoriesImg from "../assets/genres/bedtime-stories.jpg";
import childrensBooksImg from "../assets/genres/childrens-books.jpg";
import youngAdultImg from "../assets/genres/young-adult.jpg";
import adventureImg from "../assets/genres/adventure.jpg";
import horrorImg from "../assets/genres/horror.jpg";
import historicalImg from "../assets/genres/historical.jpg";
import poetryImg from "../assets/genres/poetry.jpg";
import biographyAndMemoirImg from "../assets/genres/biography-and-memoir.jpg";
import comicsAndGraphicNovelsImg from "../assets/genres/comics-and-graphic-novels.jpg";
import shortStoriesImg from "../assets/genres/short-stories.jpg";
import faithAndSpiritualityImg from "../assets/genres/faith-and-spirituality.jpg";
import educationImg from "../assets/genres/education.jpg";
import { Baby, BookOpen, Briefcase, Castle, Compass, Feather, Fingerprint, Ghost, GraduationCap, Heart, Landmark, Moon, Rocket, Scroll, Siren, Sparkles, Sprout, Sun, User, Zap, type LucideIcon } from "lucide-react";

export interface Genre {
  slug: string;
  name: string;
  icon: LucideIcon;
  /** Cover image for the genre tile. Without one, the tile shows its gradient and name. */
  image?: string;
  /** True when the picture has no title in it, so the site writes the genre name over it. */
  overlayTitle?: boolean;
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
  // Newer genres. To change a picture, replace its file in src/assets/genres/ (keep the file name).
  { slug: "bedtime-stories", image: bedtimeStoriesImg, overlayTitle: true, name: "Bedtime Stories", icon: Moon, gradient: "from-indigo-500 via-violet-800 to-slate-950" },
  { slug: "childrens-books", image: childrensBooksImg, overlayTitle: true, name: "Children's Books", icon: Baby, gradient: "from-yellow-400 via-orange-500 to-pink-700" },
  { slug: "young-adult", image: youngAdultImg, overlayTitle: true, name: "Young Adult", icon: Sparkles, gradient: "from-fuchsia-500 via-purple-700 to-indigo-950" },
  { slug: "adventure", image: adventureImg, overlayTitle: true, name: "Adventure", icon: Compass, gradient: "from-emerald-500 via-teal-700 to-slate-950" },
  { slug: "horror", image: horrorImg, overlayTitle: true, name: "Horror", icon: Ghost, gradient: "from-red-700 via-zinc-800 to-black" },
  { slug: "historical", image: historicalImg, overlayTitle: true, name: "Historical", icon: Scroll, gradient: "from-amber-700 via-stone-700 to-stone-950" },
  { slug: "poetry", image: poetryImg, name: "Poetry", icon: Feather, gradient: "from-rose-400 via-fuchsia-800 to-slate-950" },
  { slug: "biography-and-memoir", image: biographyAndMemoirImg, name: "Biography & Memoir", icon: User, gradient: "from-slate-500 via-slate-700 to-zinc-950" },
  { slug: "comics-and-graphic-novels", image: comicsAndGraphicNovelsImg, name: "Comics & Graphic Novels", icon: Zap, gradient: "from-cyan-500 via-blue-700 to-indigo-950" },
  { slug: "short-stories", image: shortStoriesImg, name: "Short Stories", icon: BookOpen, gradient: "from-lime-500 via-emerald-800 to-slate-950" },
  { slug: "faith-and-spirituality", image: faithAndSpiritualityImg, name: "Faith & Spirituality", icon: Sun, gradient: "from-sky-400 via-cyan-700 to-slate-950" },
  { slug: "education", image: educationImg, name: "Education", icon: GraduationCap, gradient: "from-blue-500 via-sky-700 to-slate-950" },
];
