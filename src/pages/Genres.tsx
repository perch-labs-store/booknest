import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SearchField from "../components/SearchField";
import GenreCard from "../components/GenreCard";
import { genres } from "../data/genres";

export default function Genres() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? genres.filter((g) => g.name.toLowerCase().includes(q)) : genres;
  }, [query]);

  return (
    <>
      <PageHeader title="Genres" subtitle="Explore books by your favorite genres.">
        <SearchField value={query} onChange={setQuery} placeholder="Search genres..." className="w-full sm:w-72" />
      </PageHeader>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {filtered.map((g) => (
            <GenreCard key={g.slug} genre={g} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <SearchX size={36} className="mb-3 text-muted" />
          <p className="font-semibold text-ink">No genres found</p>
          <p className="mt-1 text-sm text-muted">Nothing matches “{query}”. Try a different word.</p>
        </div>
      )}
    </>
  );
}
