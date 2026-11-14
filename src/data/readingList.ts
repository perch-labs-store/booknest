export type ReadingStatus = "Reading" | "Want to Read" | "Finished";

export interface ReadingItem {
  id: number;
  title: string;
  author: string;
  cover: string;
  status: ReadingStatus;
  /** 0–100 */
  progress: number;
  liked: boolean;
}

const c = (n: number) => `/covers/book${n}.jpg`;

export const initialReadingList: ReadingItem[] = [
  { id: 1, title: "The Dragon's Legacy", author: "Ellas Rowe", cover: c(5), status: "Reading", progress: 62, liked: true },
  { id: 2, title: "Before You Stay", author: "Maria Kellen", cover: c(3), status: "Reading", progress: 28, liked: false },
  { id: 3, title: "The Orbit Project", author: "Niko Ellis", cover: c(6), status: "Finished", progress: 100, liked: true },
  { id: 4, title: "Build a Better Mind", author: "Daniel Karter", cover: c(4), status: "Want to Read", progress: 0, liked: false },
  { id: 5, title: "The Fallen Realms", author: "Aeron Vale", cover: c(5), status: "Reading", progress: 76, liked: false },
  { id: 6, title: "The Small Town Promise", author: "Juliet Hayes", cover: c(10), status: "Want to Read", progress: 0, liked: false },
  { id: 7, title: "The Creator Mindset", author: "Ryan Carter", cover: c(4), status: "Want to Read", progress: 0, liked: false },
  { id: 8, title: "Whispers of the Coast", author: "Elara Voss", cover: c(3), status: "Finished", progress: 100, liked: true },
  { id: 9, title: "The Silent Evidence", author: "Marcus Lane", cover: c(8), status: "Finished", progress: 100, liked: false },
  { id: 10, title: "A Brighter Tomorrow", author: "Lena Morris", cover: c(9), status: "Want to Read", progress: 0, liked: false },
  { id: 11, title: "The Ivory Code", author: "Elara Voss", cover: c(2), status: "Want to Read", progress: 0, liked: false },
  { id: 12, title: "Digital Horizon", author: "Kai Sutherland", cover: c(7), status: "Want to Read", progress: 0, liked: false },
];
