import { useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, Plus } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ReadingCard from "../components/ReadingCard";
import { initialReadingList, type ReadingItem, type ReadingStatus } from "../data/readingList";

const TABS = ["All", "Reading", "Want to Read", "Finished"] as const;
type Tab = (typeof TABS)[number];

export default function ReadingList() {
  const [items, setItems] = useState<ReadingItem[]>(initialReadingList);
  const [tab, setTab] = useState<Tab>("All");

  const count = (t: Tab) => (t === "All" ? items.length : items.filter((i) => i.status === t).length);
  const visible = tab === "All" ? items : items.filter((i) => i.status === tab);

  const update = (id: number, patch: Partial<ReadingItem>) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const setStatus = (id: number, status: ReadingStatus) =>
    update(id, {
      status,
      // Keep progress consistent with the shelf the book is moved to.
      ...(status === "Finished" ? { progress: 100 } : status === "Want to Read" ? { progress: 0 } : {}),
    });

  return (
    <>
      <PageHeader title="Reading List" subtitle="Your saved books and reading progress.">
        <Link
          to="/add-book"
          className="flex items-center gap-1.5 self-start rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#14181F] transition hover:brightness-110"
        >
          <Plus size={16} /> Add Book
        </Link>
      </PageHeader>

      <div role="tablist" className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={t === tab}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              t === tab ? "border-b-2 border-brand bg-brand/20 text-ink" : "text-muted hover:bg-brand/10 hover:text-ink"
            }`}
          >
            {t} ({count(t)})
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {visible.map((item) => (
            <ReadingCard
              key={item.id}
              item={item}
              onToggleLike={() => update(item.id, { liked: !item.liked })}
              onSetStatus={(s) => setStatus(item.id, s)}
              onRemove={() => setItems((list) => list.filter((i) => i.id !== item.id))}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <BookMarked size={36} className="mb-3 text-muted" />
          <p className="font-semibold text-ink">{tab === "All" ? "Your reading list is empty" : `Nothing in “${tab}” yet`}</p>
          <p className="mt-1 text-sm text-muted">Save books from Search or New Releases to track them here.</p>
          <Link to="/search" className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-[#14181F]">
            Find books
          </Link>
        </div>
      )}
    </>
  );
}
