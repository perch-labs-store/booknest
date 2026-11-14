import type { Book } from "./books";

export interface ReleaseBook extends Book {
  /** Days since release. Negative = not released yet (upcoming). */
  daysAgo: number;
  likeCount: number;
}

export const releases: ReleaseBook[] = [];
