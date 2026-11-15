import { useMemo, useState } from "react";
import { UserX } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SearchField from "../components/SearchField";
import Tabs from "../components/Tabs";
import AuthorOfTheMonth from "../components/AuthorOfTheMonth";
import AuthorCard from "../components/AuthorCard";
import { authorOfTheMonth, authors } from "../data/authors";
import { useFollow } from "../context/FollowContext";

const TABS = ["All Authors", "Trending", "New Authors"] as const;
type Tab = (typeof TABS)[number];

export default function TopAuthors() {
  const [tab, setTab] = useState<Tab>("All Authors");
  const [query, setQuery] = useState("");
  const { following, toggle: toggleFollow } = useFollow();

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = authors.filter((a) => !q || a.name.toLowerCase().includes(q) || a.genres.toLowerCase().includes(q));
    switch (tab) {
      case "All Authors":
        result = [...result].sort((a, b) => b.followers - a.followers);
        break;
      case "Trending":
        result = [...result].sort((a, b) => b.growth - a.growth);
        break;
      case "New Authors":
        result = result.filter((a) => a.joinedMonthsAgo <= 12).sort((a, b) => a.joinedMonthsAgo - b.joinedMonthsAgo);
        break;
    }
    return result;
  }, [tab, query]);

  const showFeatured = Boolean(authorOfTheMonth) && tab === "All Authors" && !query.trim();

  return (
    <>
      <PageHeader title="Top Authors" subtitle="Discover the most popular and rising authors on Fablebook.">
        <SearchField value={query} onChange={setQuery} placeholder="Search authors..." className="w-full sm:w-72" />
      </PageHeader>

      <div className="mb-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {showFeatured && authorOfTheMonth && <AuthorOfTheMonth author={authorOfTheMonth} />}

      <section className={showFeatured ? "mt-8" : ""}>
        <h2 className="mb-4 font-serif text-xl font-bold text-ink">
          {showFeatured ? "Featured Authors" : tab === "All Authors" ? "Results" : tab}
        </h2>

        {list.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {list.map((a) => (
              <AuthorCard key={a.id} author={a} following={following.has(a.id)} onToggle={() => toggleFollow(a.id)} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <UserX size={36} className="mb-3 text-muted" />
            <p className="font-semibold text-ink">{authors.length === 0 ? "No authors yet" : "No authors found"}</p>
            <p className="mt-1 text-sm text-muted">{authors.length === 0 ? "Authors will appear here once they join and add books." : "Try a different name or genre."}</p>
          </div>
        )}
      </section>
    </>
  );
}
