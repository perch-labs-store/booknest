/** A discount an author runs on their book. BookNest only displays it; it is applied wherever the book is sold. */
export interface Discount {
  /** Whole number, 1-99. */
  percent: number;
  /** Last day of the offer (YYYY-MM-DD). Omitted = no end date. */
  endsOn?: string;
  /** Optional code readers enter at checkout. */
  code?: string;
}

const endOfDay = (iso: string) => new Date(`${iso}T23:59:59`);

/** The discount if it is still running today, otherwise undefined. */
export function activeDiscount(d?: Discount): Discount | undefined {
  if (!d || !(d.percent > 0)) return undefined;
  if (d.endsOn && endOfDay(d.endsOn).getTime() < Date.now()) return undefined;
  return d;
}

export const formatEndDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
