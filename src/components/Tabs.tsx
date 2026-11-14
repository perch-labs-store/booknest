interface Props<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
}

export default function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={t === active}
          onClick={() => onChange(t)}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            t === active
              ? "border-b-2 border-brand bg-brand/20 text-ink"
              : "text-muted hover:bg-brand/10 hover:text-ink"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
