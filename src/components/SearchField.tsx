import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}

export default function SearchField({ value, onChange, placeholder, className = "" }: Props) {
  return (
    <div
      className={`flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 transition focus-within:border-brand ${className}`}
    >
      <Search size={17} className="shrink-0 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search" className="text-muted hover:text-ink">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
