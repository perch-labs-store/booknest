import type { BookLink } from "./links";
import type { Discount } from "./discount";
import { genres } from "./genres";

export type Format = "eBook" | "Paperback";

export interface CatalogBook {
  id: number;
  title: string;
  author: string;
  /** Author page id (stable even if two authors share a name). */
  authorId?: string;
  cover: string;
  description: string;
  /** First entry is the primary genre; all are shown as tags (max 2). */
  genres: string[];
  formats: Format[];
  rating: number;
  ratingCount: number;
  likes: number;
  saves: number;
  links?: BookLink[];
  discount?: Discount;
}

export const catalog: CatalogBook[] = [];

/** Every genre name, from data/genres.ts (the one list to edit). */
export const GENRE_FILTERS: string[] = genres.map((g) => g.name);
export const FORMAT_FILTERS: Format[] = ["eBook", "Paperback"];
export const RATING_FILTERS = [
  { label: "Any rating", min: 0 },
  { label: "4.5+", min: 4.5 },
  { label: "4.0+", min: 4 },
  { label: "3.5+", min: 3.5 },
] as const;
