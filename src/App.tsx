import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Genres from "./pages/Genres";
import NewReleases from "./pages/NewReleases";
import TopAuthors from "./pages/TopAuthors";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import AddBook from "./pages/AddBook";
import Profile from "./pages/Profile";
import AuthorDetail from "./pages/AuthorDetail";
import BookDetails from "./pages/BookDetails";
import GenreDetail from "./pages/GenreDetail";
import LoginRedirect from "./pages/LoginRedirect";
import SsoCallback from "./pages/SsoCallback";
import ComingSoon from "./pages/ComingSoon";
import Templates from "./pages/Templates";
import TemplateEditor from "./pages/TemplateEditor";
import Settings from "./pages/Settings";
import { About, AuthorGuidelines, Contact, Copyright, Privacy, PublishingGuide, Terms } from "./pages/Info";

const comingSoonPages: { path: string; title: string }[] = [
];

export default function App() {
  return (
    <Routes>
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
