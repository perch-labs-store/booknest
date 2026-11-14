import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { authorIdForName } from "../data/authorBooks";

interface Props {
  name: string;
  className?: string;
  children?: ReactNode;
}

/** Links an author's name to their page when that author exists in the app's data. */
export default function AuthorLink({ name, className = "", children }: Props) {
  const id = authorIdForName(name);
  if (!id) return <span className={className}>{children ?? name}</span>;
  return (
    <Link to={`/authors/${id}`} className={`hover:text-accent hover:underline ${className}`}>
      {children ?? name}
    </Link>
  );
}
