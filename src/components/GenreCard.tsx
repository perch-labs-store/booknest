import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Genre } from "../data/genres";
import { getBooksByGenre } from "../data/allBooks";

export default function GenreCard({ genre }: { genre: Genre }) {
  return (
    <Link
      to={`/genres/${genre.slug}`}
      aria-label={genre.name}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {genre.image ? (
        /* genre artwork (title is part of the image) */
        <>
          <img
            src={genre.image}
            alt={genre.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {genre.overlayTitle && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-12 text-center">
              <span className="font-serif text-xl font-semibold leading-tight text-white sm:text-2xl">{genre.name}</span>
              <span className="mt-1.5 flex items-center gap-2 text-white/70" aria-hidden>
                <span className="h-px w-10 bg-white/40" />
                <BookOpen size={13} />
                <span className="h-px w-10 bg-white/40" />
              </span>
            </div>
          )}
        </>
      ) : (
        /* no artwork yet: gradient tile with the name */
        <div className={`flex h-full w-full flex-col justify-end bg-gradient-to-br ${genre.gradient} p-4 transition duration-500 group-hover:scale-105`}>
          <genre.icon size={72} strokeWidth={1.25} className="absolute right-4 top-4 text-white/25" aria-hidden />
          <span className="font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">{genre.name}</span>
        </div>
      )}

      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
        {getBooksByGenre(genre.name).length.toLocaleString()} books
        <ArrowRight size={12} className="opacity-0 transition group-hover:opacity-100" />
      </div>
    </Link>
  );
}
