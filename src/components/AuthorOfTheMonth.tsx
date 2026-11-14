import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, BookOpen, Heart, Users } from "lucide-react";
import type { Author } from "../data/authors";
import { compact } from "../utils/format";
import Avatar from "./Avatar";

export default function AuthorOfTheMonth({ author }: { author: Author }) {
  const stats = [
    { icon: BookOpen, value: String(author.books), label: "Books" },
    { icon: Users, value: compact(author.followers), label: "Followers" },
    { icon: Heart, value: `${author.rating} (${compact(author.ratingCount)})`, label: "Rating" },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500 via-rose-800 to-indigo-950 p-6 text-white sm:p-8">
      <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-5">
          <Avatar name={author.name} className="h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl" />
          <div className="max-w-md">
            <p className="text-sm font-medium text-amber-200">✦ Author of the Month ✦</p>
            <h2 className="mt-1 flex items-center gap-2 font-serif text-3xl font-bold sm:text-4xl">
              {author.name}
              {author.verified && <BadgeCheck size={24} className="fill-info text-white" aria-label="Verified" />}
            </h2>
            <p className="mt-1 text-sm text-white/80">{author.genres}</p>
            <p className="mt-2 text-sm text-white/70">{author.bio}</p>
            <Link
              to={`/authors/${author.id}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-[#14181F] transition hover:brightness-110"
            >
              View Profile <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <ul className="grid grid-cols-3 gap-3 rounded-xl bg-black/35 p-4 backdrop-blur md:grid-cols-1 md:gap-2.5">
          {stats.map(({ icon: Icon, value, label }) => (
            <li key={label} className="flex items-center gap-2.5 text-sm">
              <Icon size={18} className="hidden shrink-0 text-amber-200 sm:block" />
              <div>
                <p className="font-semibold leading-tight">{value}</p>
                <p className="text-xs text-white/65">{label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
