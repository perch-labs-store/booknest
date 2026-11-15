import { lazy, Suspense } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
const Genres = lazy(() => import("./pages/Genres"));
const NewReleases = lazy(() => import("./pages/NewReleases"));
const TopAuthors = lazy(() => import("./pages/TopAuthors"));
const Search = lazy(() => import("./pages/Search"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AddBook = lazy(() => import("./pages/AddBook"));
const Profile = lazy(() => import("./pages/Profile"));
const AuthorDetail = lazy(() => import("./pages/AuthorDetail"));
const BookDetails = lazy(() => import("./pages/BookDetails"));
const GenreDetail = lazy(() => import("./pages/GenreDetail"));
const LoginRedirect = lazy(() => import("./pages/LoginRedirect"));
const SsoCallback = lazy(() => import("./pages/SsoCallback"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const Templates = lazy(() => import("./pages/Templates"));
const TemplateEditor = lazy(() => import("./pages/TemplateEditor"));
const Settings = lazy(() => import("./pages/Settings"));
// Only Home is in the first download; every other page is fetched when it is opened.
const lazyInfo = <K extends "About" | "AuthorGuidelines" | "Contact" | "Copyright" | "Privacy" | "PublishingGuide" | "Terms">(k: K) =>
  lazy(() => import("./pages/Info").then((m) => ({ default: m[k] })));
const About = lazyInfo("About");
const AuthorGuidelines = lazyInfo("AuthorGuidelines");
const Contact = lazyInfo("Contact");
const Copyright = lazyInfo("Copyright");
const Privacy = lazyInfo("Privacy");
const PublishingGuide = lazyInfo("PublishingGuide");
const Terms = lazyInfo("Terms");

const PublishedSite = lazy(() => import("./pages/PublishedSite"));

/** /s/<name>: an author's published site by path. Used as the shareable link when no root domain is set, and for testing. */
function SiteByPath() {
  const { subdomain = "" } = useParams();
  return (
    <Suspense fallback={null}>
      <PublishedSite subdomain={subdomain.toLowerCase()} />
    </Suspense>
  );
}

const comingSoonPages: { path: string; title: string }[] = [
];

export default function App() {
  return (
    <Routes>
      {/* Outside the Layout: a published site has none of the BookNest chrome. */}
      <Route path="s/:subdomain" element={<SiteByPath />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="genres" element={<Genres />} />
        <Route path="genres/:slug" element={<GenreDetail />} />
        <Route path="new-releases" element={<NewReleases />} />
        <Route path="top-authors" element={<TopAuthors />} />
        <Route path="authors/:id" element={<AuthorDetail />} />
        <Route path="books/:slug" element={<BookDetails />} />
        <Route path="templates" element={<Templates />} />
        <Route path="templates/:id" element={<TemplateEditor />} />
        <Route path="search" element={<Search />} />
        <Route path="add-book" element={<AddBook />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="guide" element={<PublishingGuide />} />
        <Route path="guidelines" element={<AuthorGuidelines />} />
        <Route path="copyright" element={<Copyright />} />
        <Route path="login" element={<LoginRedirect />} />
        <Route path="sso-callback" element={<SsoCallback />} />
        <Route path="contact" element={<Contact />} />
        <Route path="about" element={<About />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        {comingSoonPages.map((p) => (
          <Route key={p.path} path={p.path} element={<ComingSoon title={p.title} />} />
        ))}
        <Route path="*" element={<ComingSoon title="Page not found" />} />
      </Route>
    </Routes>
  );
}
