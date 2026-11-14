import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

export default function SearchBar() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-line bg-surface px-4 transition focus-within:border-brand">
      <Search size={18} className="text-ink" />
      <input
        ref={ref}
        type="text"
        placeholder="Search books, authors and genres..."
        className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
      />
      <div className="hidden items-center gap-1 sm:flex">
        <kbd className="rounded border border-line bg-bg px-1.5 py-0.5 text-[11px] text-muted">Ctrl</kbd>
        <kbd className="rounded border border-line bg-bg px-1.5 py-0.5 text-[11px] text-muted">K</kbd>
      </div>
    </div>
  );
}
