import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, BookOpen, Check, ChevronRight, Copy, Copyright as CopyrightIcon, Info, LogIn, LogOut, Mail, MessageSquarePlus, Moon, ScrollText, Settings as Gear, ShieldCheck, ShieldHalf, Sun, ExternalLink, type LucideIcon } from "lucide-react";
// TODO(payments): re-enable "Become verified" when payments are added.
// import VerificationCard from "../components/VerificationCard";
import { Toggle, PushToggle } from "../components/SettingsToggles";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useTheme } from "../context/ThemeContext";
// import { initialMyBooks } from "../data/profile"; // TODO(payments): needed again with "Become verified"
import { COMPANY } from "../data/company";

const Heading = ({ children }: { children: ReactNode }) => (
  <h2 className="mb-1 mt-7 px-1 text-xs font-medium uppercase tracking-wide text-muted">{children}</h2>
);

const rowCls = "flex w-full items-center gap-4 rounded-xl px-1 py-3.5 text-left text-[15px] text-ink transition hover:bg-brand/10";

function Row({ icon: Icon, label, to, onClick, external }: { icon: LucideIcon; label: string; to?: string; onClick?: () => void; external?: boolean }) {
  const inner = (
    <>
      <Icon size={20} className="shrink-0 text-muted" />
      <span className="flex-1">{label}</span>
      {external ? <ExternalLink size={16} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />}
    </>
  );
  if (external && to) return <a href={to} target="_blank" rel="noopener noreferrer" className={rowCls}>{inner}</a>;
  if (to) return <Link to={to} className={rowCls}>{inner}</Link>;
  return <button onClick={onClick} className={rowCls}>{inner}</button>;
}

export default function Settings() {
  const navigate = useNavigate();
  const { signedIn, loading, signOut } = useAuth();
  const auth = useAuthModal();
  // TODO(payments): add back `profile` and `authorId` with "Become verified".
  const { prefs, updatePrefs } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const isDark = theme === "dark";
  // const published = initialMyBooks.filter((b) => b.status === "Published").length; // TODO(payments)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(COMPANY.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  if (loading) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-2 flex items-center gap-4">
        <button onClick={() => navigate(-1)} aria-label="Back" className="rounded-full p-2 text-ink hover:bg-brand/10">
          <ArrowLeft size={22} />
        </button>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink"><Gear size={20} className="text-muted" /> Settings</h1>
      </header>

      {signedIn ? (
        <>
          <Heading>Account</Heading>
          <Row icon={Gear} label="Edit Profile" onClick={() => navigate("/profile", { state: { edit: true } })} />
          <Row icon={BarChart3} label="Analytics" onClick={() => navigate("/profile", { state: { tab: "Stats" } })} />
          {/* TODO(payments): "Become verified" is switched off for now. Re-enable it when payments are added.
          <div className="mt-2">
            <VerificationCard verified={profile.verified} authorId={authorId} publishedCount={published} />
          </div>
          */}

          <Heading>Notifications &amp; privacy</Heading>
          <div className="divide-y divide-line rounded-2xl border border-line bg-surface px-5">
            <PushToggle />
            {/* TODO(email): hidden until emails are actually sent. Re-enable with the email feature.
            <Toggle label="Email updates" desc="Get new release and activity summaries by email." on={prefs.emailUpdates} onChange={(v) => updatePrefs({ emailUpdates: v })} />
            */}
            <Toggle label="New follower alerts" desc="Notify me when someone follows me." on={prefs.followerAlerts} onChange={(v) => updatePrefs({ followerAlerts: v })} />
            <Toggle label="Show follower count" desc="Display your follower count on your profile." on={prefs.showFollowers} onChange={(v) => updatePrefs({ showFollowers: v })} />
          </div>

          <Heading>Author resources</Heading>
          <Row icon={BookOpen} label="Publishing Guide" to="/guide" />
          <Row icon={ShieldCheck} label="Author Guidelines" to="/guidelines" />
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 text-center">
          <p className="font-semibold text-ink">Sign in to manage your account</p>
          <p className="mt-1 text-sm text-muted">Edit your profile, see analytics and change notification settings.</p>
          <button onClick={() => auth.open("signin")} className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-[#14181F] hover:brightness-110">Sign in</button>
        </div>
      )}

      <Heading>Discover</Heading>
      <Row icon={Info} label={`About ${COMPANY.product}`} to="/about" />

      <Heading>Connect</Heading>
      <div className={`${rowCls} cursor-default hover:bg-transparent`}>
        <Mail size={20} className="shrink-0 text-muted" />
        <a href={`mailto:${COMPANY.email}`} className="min-w-0 flex-1 break-all">{COMPANY.email}</a>
        <button onClick={copyEmail} aria-label="Copy email address" className="rounded-md p-1 text-muted hover:text-ink">
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
      <Row icon={MessageSquarePlus} label="Submit a Request" to="/contact" />
      {COMPANY.instagram && <Row icon={ExternalLink} label="Follow us on Instagram" to={COMPANY.instagram} external />}
      {COMPANY.x && <Row icon={ExternalLink} label="Follow us on X" to={COMPANY.x} external />}

      <Heading>Legal</Heading>
      <Row icon={ShieldHalf} label="Privacy Policy" to="/privacy" />
      <Row icon={ScrollText} label="Terms of Service" to="/terms" />
      <Row icon={CopyrightIcon} label="Copyright & DMCA" to="/copyright" />

      <Heading>Preferences</Heading>
      <div className="flex items-center justify-between px-1 py-2">
        <span className="text-[15px] text-ink">Theme</span>
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-ink transition hover:bg-brand/10"
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <button
        onClick={() => (signedIn ? void signOut().then(() => navigate("/")) : auth.open("signin"))}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border py-3.5 font-semibold transition ${
          signedIn ? "border-error/40 text-error hover:bg-error/10" : "border-line text-ink hover:bg-brand/10"
        }`}
      >
        {signedIn ? <><LogOut size={18} /> Log out</> : <><LogIn size={18} /> Sign in</>}
      </button>
      <p className="mb-4 mt-5 text-center text-xs text-muted">v{COMPANY.version}</p>
    </div>
  );
}
