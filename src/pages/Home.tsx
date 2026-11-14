import SearchBar from "../components/SearchBar";
import Hero from "../components/Hero";
import BookSection from "../components/BookSection";
import { recommendedBooks, trendingBooks } from "../data/books";

export default function Home() {
  return (
    <>
      <div className="mb-6">
        <SearchBar />
      </div>
      <Hero />
      <BookSection title="Trending Books" books={trendingBooks} />
      <BookSection title="Recommended for You" books={recommendedBooks} />
    </>
  );
}
