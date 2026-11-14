import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import type { Author } from "../data/authors";
import { compact } from "../utils/format";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";

interface Props {
  author: Author;
  following: boolean;
  onToggle: () => void;
}

export default function AuthorCard({ author, following, onToggle }: Props) {
  const followers = author.followers + (following ? 1 : 0);
  return (
    <article className="flex flex-col items-center rounded-2xl border border-line bg-surface p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={`/authors/${author.id}`} className="flex flex-col items-center" aria-label={`View ${author.name}'s profile`}>
        <Avatar name={author.name} className="h-16 w-16 text-xl" />
        <h3 className="mt-3 flex items-center gap-1 text-sm font-semibold text-ink hover:text-accent">
          {author.name}
          {author.verified && <BadgeCheck size={15} className="shrink-0 fill-info text-white" aria-label="Verified" />}
        </h3>
        <p className="mt-0.5 text-xs text-muted">{author.genres}</p>
        <p className="mt-0.5 text-xs text-muted">{compact(followers)} followers</p>
      </Link>
      <FollowButton following={following} onToggle={onToggle} className="mt-3 w-full" />
    </article>
  );
}
