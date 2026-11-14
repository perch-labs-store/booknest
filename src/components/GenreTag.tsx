import { Link } from "react-router-dom";
import { genreSlug } from "../data/allBooks";

/** A genre label that opens the list of books in that genre. */
export default function GenreTag({ name, className = "" }: { name: string; className?: string }) {
  return (
    <Link to={`/genres/${genreSlug(name)}`} className={`transition hover:border-brand hover:bg-brand/15 hover:text-ink ${className}`}>
      {name}
    </Link>
  );
}
