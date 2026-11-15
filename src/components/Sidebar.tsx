import { NavLink, Link } from "react-router-dom";
import {
  BookOpen,
  Home,
  Award,
  Search,
  Bell,
  Library,
  Flame,
  PlusSquare,
  LayoutTemplate,
  User,
  Headset,
  Info,
  ShieldCheck,
  ScrollText,
  LogIn,
  LogOut,
  Moon,
  Sun,
  PanelLeft,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useAuth } from "../context/AuthContext";
import InstallButton from "./InstallButton";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const main: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/top-authors", label: "Top Authors", icon: Award },
  { to: "/search", label: "Search", icon: Search },
  { to: "/notifications", label: "Notifications", icon: Bell },
];
const genres: NavItem[] = [
  { to: "/genres", label: "Genres", icon: Library },
  { to: "/new-releases", label: "New Releases", icon: Flame },
];
const user: NavItem[] = [
  { to: "/add-book", label: "Add a Book", icon: PlusSquare },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/profile", label: "My Profile", icon: User },
];
const information: NavItem[] = [
  { to: "/contact", label: "Contact Us", icon: Headset },
  { to: "/about", label: "About Fablebook", icon: Info },
  { to: "/privacy", label: "Privacy Policy", icon: ShieldCheck },
  { to: "/terms", label: "Terms of Service", icon: ScrollText },
];

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const auth = useAuthModal();
  const { signedIn, signOut } = useAuth();

  const link = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === "/"}
      onClick={onCloseMobile}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
          collapsed ? "lg:justify-center lg:px-0" : ""
        } ${
          isActive
            ? "bg-brand/20 text-ink dark:bg-brand/25"
            : "text-ink/90 hover:bg-brand/10"
        }`
      }
    >
      <item.icon size={16} className="shrink-0" />
      <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
    </NavLink>
  );

  const heading = (text: string) => (
    <p className={`mb-1 mt-4 px-3 text-[11px] font-medium uppercase tracking-wide text-muted ${collapsed ? "lg:hidden" : ""}`}>{text}</p>
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface px-3 py-4 transition-all duration-200 lg:static lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "lg:w-[72px]" : "lg:w-60"}`}
    >
      {/* Logo + collapse */}
      <div className={`mb-4 flex items-center justify-between px-2 ${collapsed ? "lg:flex-col lg:gap-3 lg:px-0" : ""}`}>
        <Link to="/" onClick={onCloseMobile} className="flex items-center gap-2 text-ink">
          <BookOpen size={28} className="shrink-0 text-accent" strokeWidth={1.8} />
          <span className={`font-serif text-2xl font-bold ${collapsed ? "lg:hidden" : ""}`}>Fablebook</span>
        </Link>
        <button
          onClick={onToggleCollapse}
          className="hidden rounded-md p-1.5 text-muted hover:bg-brand/10 hover:text-ink lg:block"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <button
          onClick={onCloseMobile}
          className="rounded-md p-1.5 text-muted hover:text-ink lg:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-0.5">{main.map(link)}</div>
        {heading("Genres")}
        <div className="space-y-0.5">{genres.map(link)}</div>
        {heading("User")}
        <div className="space-y-0.5">{user.map(link)}</div>
        {heading("Information")}
        <div className="space-y-0.5">{information.map(link)}</div>
      </nav>

      <InstallButton collapsed={collapsed} />

      {/* Footer: login + theme toggle */}
      <div className={`mt-4 flex items-center gap-2 border-t border-line pt-4 ${collapsed ? "lg:flex-col" : ""}`}>
        <button
          onClick={() => {
            onCloseMobile();
            if (signedIn) void signOut();
            else auth.open("signin");
          }}
          title={signedIn ? "Sign out" : "Login"}
          className={`flex flex-1 items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] font-medium text-ink hover:bg-brand/10 ${
            collapsed ? "lg:flex-none lg:p-2" : ""
          }`}
        >
          {signedIn ? <LogOut size={16} className="shrink-0" /> : <LogIn size={16} className="shrink-0" />}
          <span className={collapsed ? "lg:hidden" : ""}>{signedIn ? "Sign out" : "Login"}</span>
        </button>
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="rounded-lg border border-line p-2 text-ink transition hover:bg-brand/10"
        >
          {isDark ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </aside>
  );
}
