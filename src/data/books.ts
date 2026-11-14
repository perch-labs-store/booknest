import type { Discount } from "./discount";

export interface Book {
  id: number;
  title: string;
  author: string;
  cover: string;
  likes: string;
  saves: string;
  discount?: Discount;
}

export const trendingBooks: Book[] = [];

export const recommendedBooks: Book[] = [];
