import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import WelcomePrompt from "./WelcomePrompt";
import PushPrompt from "./PushPrompt";
import BottomNav from "./BottomNav";
import { useAuth } from "../context/AuthContext";
import { loadRemote, useRemoteVersion } from "../data/remote";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { signedIn, loading } = useAuth();
  const dataVersion = useRemoteVersion();

  // Start loading books straight away: they're public, so there's no need to wait for Clerk to restore the session.
  // On the Home page the most-liked books arrive first and the rest of the catalog follows in the background.
  const settled = useRef(false);
  useEffect(() => {
    loadRemote({ quick: pathname === "/" }).catch((e) => console.error("[BookNest] Could not load data:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the session is known, load again only if it matters: signed in (own drafts), or signed out after being signed in.
  useEffect(() => {
    if (loading) return;
    if (!settled.current) {
      settled.current = true;
      if (!signedIn) return; // signed-out visitors already have everything they can see
    }
    loadRemote().catch((e) => console.error("[BookNest] Could not load data:", e));
  }, [signedIn, loading]);

  // <main> is the scroll container, so reset it when navigating to a new page.
  useEffect(() => { mainRef.current?.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="flex h-full bg-bg">
      <WelcomePrompt />
      <PushPrompt />
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main ref={mainRef} className="flex min-w-0 flex-1 flex-col overflow-y-auto no-scrollbar">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 sm:px-6 lg:pb-5">
          <button
            onClick={() => setMobileOpen(true)}
            className="mb-4 rounded-lg border border-line bg-surface p-2.5 text-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          {/* Re-render pages when data arrives. The Add Book form and book pages manage their own updates so nothing you typed is lost. */}
          {/* Home, the Hero and book pages watch the data themselves, so they are not torn down and rebuilt on every refresh. */}
          <div key={pathname === "/" || pathname.startsWith("/add-book") || pathname.startsWith("/books/") ? "stable" : dataVersion}>
            <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
