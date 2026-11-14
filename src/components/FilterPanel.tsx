import { Check } from "lucide-react";
import { FORMAT_FILTERS, GENRE_FILTERS, RATING_FILTERS, type Format } from "../data/catalog";

export interface Filters {
  genres: string[];
  formats: Format[];
  minRating: number;
}

interface Props {
  value: Filters;
  onChange: (f: Filters) => void;
  genreCounts: Record<string, number>;
  formatCounts: Record<string, number>;
}

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

function Checkbox({ checked, label, count, onClick }: { checked: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-1 py-1.5 text-left text-[13px] text-ink/90 hover:text-ink"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
          checked ? "border-brand bg-brand text-[#14181F]" : "border-muted/60"
        }`}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="flex-1">{label}</span>
      <span className="text-xs text-muted">({count})</span>
    </button>
  );
}

function Radio({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-1 py-1.5 text-left text-[13px] text-ink/90 hover:text-ink"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          checked ? "border-brand" : "border-muted/60"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-brand" />}
      </span>
      {label}
    </button>
  );
}

const Heading = ({ children }: { children: string }) => (
  <p className="mb-1.5 mt-4 text-sm font-semibold text-ink first:mt-0">{children}</p>
);

export default function FilterPanel({ value, onChange, genreCounts, formatCounts }: Props) {
  const active = value.genres.length + value.formats.length + (value.minRating > 0 ? 1 : 0);

  return (
    <aside className="rounded-2xl border border-line bg-surface p-4 lg:sticky lg:top-0" aria-label="Filter results">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Filter Results</h2>
        {active > 0 && (
          <button
            onClick={() => onChange({ genres: [], formats: [], minRating: 0 })}
            className="text-xs font-medium text-accent hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <Heading>Genre</Heading>
      {GENRE_FILTERS.map((g) => (
        <Checkbox
          key={g}
          label={g}
          count={genreCounts[g] ?? 0}
          checked={value.genres.includes(g)}
          onClick={() => onChange({ ...value, genres: toggle(value.genres, g) })}
        />
      ))}

      <Heading>Format</Heading>
      {FORMAT_FILTERS.map((f) => (
        <Checkbox
          key={f}
          label={f}
          count={formatCounts[f] ?? 0}
          checked={value.formats.includes(f)}
          onClick={() => onChange({ ...value, formats: toggle(value.formats, f) })}
        />
      ))}

      <Heading>Rating</Heading>
      <div role="radiogroup" aria-label="Minimum rating">
        {RATING_FILTERS.map((r) => (
          <Radio key={r.label} label={r.label} checked={value.minRating === r.min} onClick={() => onChange({ ...value, minRating: r.min })} />
        ))}
      </div>
    </aside>
  );
}
