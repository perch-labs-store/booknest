import { NavLink } from "react-router-dom";
import { Home, Layers, Plus, Search, User } from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

/** Floating glass tab bar for small screens (hidden from `lg` up, where the sidebar takes over). */
export default function BottomNav() {
  const { profile, avatarUrl } = useProfile();
  const { signedIn } = useAuth();

  const tab = (to: string, label: string, icon: JSX.Element, end = false) => (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        `grid h-11 w-11 place-items-center rounded-full transition-colors ${isActive ? "bg-brand/25 text-accent" : "text-ink/80 active:bg-brand/15"}`
      }
    >
      {icon}
    </NavLink>
  );

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-6 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <div
        className="flex w-full max-w-sm items-center justify-between rounded-full border border-white/15 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150"
        style={{ background: "color-mix(in srgb, var(--surface) 55%, transparent)" }}
      >
        {tab("/", "Home", <Home size={22} />, true)}
        {tab("/search", "Search", <Search size={22} />)}
        {tab("/add-book", "Add a book", <Plus size={26} />)}
        {tab("/genres", "Genres", <Layers size={22} />)}
        <NavLink to="/profile" aria-label="My profile" className="grid h-11 w-11 place-items-center rounded-full">
          {({ isActive }) =>
            !signedIn ? (
              <User size={22} className={isActive ? "text-accent" : "text-ink/80"} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="" className={`h-8 w-8 rounded-full object-cover ${isActive ? "ring-2 ring-brand" : ""}`} />
            ) : (
              <Avatar name={profile.name || "?"} className={`h-8 w-8 text-sm ${isActive ? "ring-2 ring-brand" : ""}`} />
            )
          }
        </NavLink>
      </div>
    </nav>
  );
}
