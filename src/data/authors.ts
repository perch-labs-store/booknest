export interface Author {
  id: string;
  name: string;
  genres: string;
  bio: string;
  /** Longer author story (About tab). */
  about?: string;
  /** Id of the book the author pinned to the top of their page. */
  featuredBookId?: number;
  /** Cover banner image. */
  bannerUrl?: string;
  followers: number;
  books: number;
  rating: number;
  ratingCount: number;
  verified: boolean;
  /** follower growth this month (%), used by the "Trending" tab */
  growth: number;
  /** Languages the author writes in. */
  languages?: string[];
  /** ISO date the author joined. */
  joinedAt?: string;
  /** months since joining, used by the "New Authors" tab */
  joinedMonthsAgo: number;
}

/** Nobody is featured until an author is picked. */
export const authorOfTheMonth = null as Author | null;

export const authors: Author[] = [];
