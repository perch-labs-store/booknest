import type { SocialLinks } from "./socials";
import type { BookLink } from "./links";
import type { Discount } from "./discount";

export interface Profile {
  name: string;
  username: string;
  verified: boolean;
  bio: string;
  /** Longer author story shown on the About tab. */
  about: string;
  /** Private legal name (never shown publicly); `name` is the pen name readers see. */
  realName: string;
  /** The published book pinned to the top of the author page. */
  featuredBookId: number | null;
  /** Languages the author writes in. */
  languages: string[];
  /** ISO date the account was created ("member since"). */
  joinedAt: string;
  /** Up to 3 genres the author writes. */
  genres: string[];
  location: string;
  website: string;
  /** Full social media URLs the author has added. */
  socials: SocialLinks;
  followers: number;
  following: number;
}

/** Blank until the author fills in their profile. */
export const initialProfile: Profile = {
  name: "",
  username: "",
  verified: false,
  bio: "",
  about: "",
  realName: "",
  featuredBookId: null,
  genres: [],
  languages: [],
  joinedAt: "",
  location: "",
  website: "",
  socials: {},
  followers: 0,
  following: 0,
};

export interface MyBook {
  id: number;
  title: string;
  cover: string;
  likes: number;
  saves: number;
  links?: BookLink[];
  discount?: Discount;
  status: "Published" | "Draft";
}

export const initialMyBooks: MyBook[] = [];
