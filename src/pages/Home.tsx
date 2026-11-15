import SearchBar from "../components/SearchBar";
import Hero from "../components/Hero";
import BookSection from "../components/BookSection";
import { getRecommendedBooks, getTrendingBooks, toCard } from "../data/allBooks";
import { useRemoteVersion } from "../data/remote";
import { useLibrary } from "../context/LibraryContext";
import { useFollow } from "../context/FollowContext";

export default function Home() {
  useRemoteVersion(); // re-render when books load from the database
  const { liked, saved } = useLibrary();
  const { following } = useFollow();

  const trending = getTrendingBooks(10);
  const recommended = getRecommendedBooks({ liked, saved, following }, 10, new Set(trending.slice(0, 5).map((b) => b.slug)));

  return (
    <>
      <div className="mb-6">
        <SearchBar />
      </div>
      <Hero />
      <BookSection title="Trending Books" books={trending.map(toCard)} />
      <BookSection title="Recommended for You" books={recommended.map(toCard)} />
    </>
  );
}
