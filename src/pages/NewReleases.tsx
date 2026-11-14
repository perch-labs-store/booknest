import { useMemo, useState } from "react";
import { BookX, ChevronDown } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Tabs from "../components/Tabs";
import BookCard from "../components/BookCard";
import { releases, type ReleaseBook } from "../data/releases";

const TABS = ["All", "This Week", "This Month", "Upcoming"] as const;
type Tab = (typeof TABS)[number];

const SORTS = ["Newest", "Oldest", "Most Liked", "A–Z"] as const;
type Sort = (typeof SORTS)[number];

const DAY = 86_400_000;
const fmt = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * DAY).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function inTab(b: ReleaseBook, tab: Tab) {
  switch (tab) {
    case "All":
      return b.daysAgo >= 0;
    case "This Week":
      return b.daysAgo >= 0 && b.daysAgo <= 7;
    case "This Month":
      return b.daysAgo >= 0 && b.daysAgo <= 30;
    case "Upcoming":
      return b.daysAgo < 0;
  }
}

function sortBooks(list: ReleaseBook[], sort: Sort, tab: Tab) {
  const copy = [...list];
  switch (sort) {
    case "Newest":
      // For upcoming, "newest" means the soonest release first.
      return copy.sort((a, b) => (tab === "Upcoming" ? b.daysAgo - a.daysAgo : a.daysAgo - b.daysAgo));
    case "Oldest":
      return copy.sort((a, b) => (tab === "Upcoming" ? a.daysAgo - b.daysAgo : b.daysAgo - a.daysAgo));
    case "Most Liked":
      return copy.sort((a, b) => b.likeCount - a.likeCount);
    case "A–Z":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export default function NewReleases() {
  const [tab, setTab] = useState<Tab>("All");
  const [sort, setSort] = useState<Sort>("Newest");

  const books = useMemo(() => sortBooks(releases.filter((b) => inTab(b, tab)), sort, tab), [tab, sort]);

  return (
    <>
      <PageHeader title="New Releases" subtitle="The latest books from your favorite authors." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        <label className="relative flex items-center self-start sm:self-auto">
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-10 cursor-pointer appearance-none rounded-lg border border-line bg-surface pl-3 pr-9 text-sm text-ink focus:border-brand focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                Sort by: {s}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 text-muted" />
        </label>
      </div>

      {books.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {books.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              badge={b.daysAgo < 0 ? "Soon" : b.daysAgo <= 7 ? "New" : undefined}
              note={b.daysAgo < 0 ? `Releases ${fmt(b.daysAgo)}` : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <BookX size={36} className="mb-3 text-muted" />
          <p className="font-semibold text-ink">No books here yet</p>
          <p className="mt-1 text-sm text-muted">Check back soon for new releases.</p>
        </div>
      )}
    </>
  );
}
