/** An external place where a book can be bought (Fablebook only lists books: nothing is sold or read here). */
export type LinkFormat = "printed" | "ebook" | "audiobook";
export type LinkStore = "amazon" | "other";

export interface BookLink {
  format: LinkFormat;
  store: LinkStore;
  url: string;
}

export const LINK_FORMATS: LinkFormat[] = ["printed", "ebook", "audiobook"];

export const FORMAT_LABELS: Record<LinkFormat, string> = {
  printed: "Printed copy",
  ebook: "eBook",
  audiobook: "Audiobook",
};

export const STORE_LABELS: Record<LinkStore, string> = {
  amazon: "Amazon",
  other: "Other store",
};

/** Printed, then eBook, then audiobook; Amazon before other stores inside each group. */
export function sortLinks(links: BookLink[]): BookLink[] {
  const rank = (l: BookLink) => LINK_FORMATS.indexOf(l.format) * 2 + (l.store === "amazon" ? 0 : 1);
  return [...links].sort((a, b) => rank(a) - rank(b));
}

/** Adds https:// when missing and returns a clean URL, or null when it isn't a valid http(s) link. */
export function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const u = new URL(withScheme);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}
