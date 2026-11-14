import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Genre } from "../data/genres";
import { getBooksByGenre } from "../data/allBooks";

export default function GenreCard({ genre }: { genre: Genre }) {
  return (
    <Link
      to={`/genres/${genre.slug}`}
      aria-label={genre.name}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {/* genre artwork (title is part of the image) */}
      <img
        src={genre.image}
        alt={genre.name}
        loading="lazy"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />

      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
        {getBooksByGenre(genre.name).length.toLocaleString()} books
        <ArrowRight size={12} className="opacity-0 transition group-hover:opacity-100" />
      </div>
    </Link>
  );
}
