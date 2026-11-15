import { useEffect, useState } from "react";
import { BellOff, CheckCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Tabs from "../components/Tabs";
import NotificationItem from "../components/NotificationItem";
import type { AppNotification } from "../data/notifications";
import { deleteNotification, loadNotifications, setNotificationRead } from "../data/remote";
import { useAuth } from "../context/AuthContext";

const TABS = ["All", "Likes", "Comments", "Follows", "Updates"] as const;
type Tab = (typeof TABS)[number];

const matches = (n: AppNotification, tab: Tab) =>
  tab === "All" ||
  (tab === "Likes" && n.type === "like") ||
  (tab === "Comments" && n.type === "comment") ||
  (tab === "Follows" && n.type === "follow") ||
  (tab === "Updates" && (n.type === "update" || n.type === "milestone"));

export default function Notifications() {
  const { signedIn, loading } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);

  // Notifications live in Supabase; each change below is saved there too.
  useEffect(() => {
    if (loading) return;
    if (!signedIn) return setItems([]);
    let cancelled = false;
    loadNotifications().then((list) => !cancelled && setItems(list));
    return () => {
      cancelled = true;
    };
  }, [signedIn, loading]);

  const log = (e: unknown) => console.error("[Fablebook] Could not save notification change:", e);
  const [tab, setTab] = useState<Tab>("All");
  const [followed, setFollowed] = useState<Set<number>>(new Set());

  const visible = items.filter((n) => matches(n, tab));
  const unread = items.filter((n) => !n.read).length;

  const toggleFollow = (id: number) =>
    setFollowed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <PageHeader title="Notifications" subtitle="Stay updated with your books, followers and activity." />

      <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <button
          onClick={() => {
            setItems((l) => l.map((n) => ({ ...n, read: true })));
            setNotificationRead("all", true).catch(log);
          }}
          disabled={unread === 0}
          className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink transition hover:text-accent disabled:cursor-default disabled:text-muted disabled:hover:text-muted"
        >
          Mark all as read <CheckCheck size={15} />
        </button>
      </div>

      {visible.length > 0 ? (
        <ul>
          {visible.map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              followingBack={followed.has(n.id)}
              onFollowBack={() => toggleFollow(n.id)}
              onToggleRead={() => {
                setItems((l) => l.map((x) => (x.id === n.id ? { ...x, read: !x.read } : x)));
                setNotificationRead([n.id], !n.read).catch(log);
              }}
              onDelete={() => {
                setItems((l) => l.filter((x) => x.id !== n.id));
                deleteNotification(n.id).catch(log);
              }}
            />
          ))}
        </ul>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <BellOff size={36} className="mb-3 text-muted" />
          <p className="font-semibold text-ink">You're all caught up</p>
          <p className="mt-1 text-sm text-muted">New activity will show up here.</p>
        </div>
      )}
    </>
  );
}
