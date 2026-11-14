import { useEffect, useRef, useState } from "react";
import { Bell, Heart, MessageSquare, MoreHorizontal, PartyPopper } from "lucide-react";
import Avatar from "./Avatar";
import type { AppNotification } from "../data/notifications";

interface Props {
  n: AppNotification;
  followingBack: boolean;
  onToggleRead: () => void;
  onDelete: () => void;
  onFollowBack: () => void;
}

function Lead({ n }: { n: AppNotification }) {
  if (n.actor && n.type !== "update") return <Avatar name={n.actor} className="h-12 w-12 text-base" />;
  const Icon = n.type === "update" ? Bell : n.type === "milestone" ? Heart : PartyPopper;
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/15 text-accent ring-2 ring-line">
      <Icon size={20} className={n.type === "milestone" ? "fill-current" : ""} />
    </div>
  );
}

export default function NotificationItem({ n, followingBack, onToggleRead, onDelete, onFollowBack }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <li className={`relative flex items-center gap-4 border-b border-line px-2 py-4 ${n.read ? "" : "bg-brand/5"}`}>
      {!n.read && (
        <span aria-label="Unread" className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-brand" />
      )}
      <Lead n={n} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{n.title}</p>
        {n.detail && (
          <p className={`mt-0.5 truncate text-sm ${n.detailKind === "book" ? "text-accent" : "text-muted"}`}>
            {n.detail}
            {n.type === "update" && <span className="text-ink/90"> is now available!</span>}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted">{n.time}</p>
      </div>

      {/* Right-hand slot */}
      {n.cover && (
        <img src={n.cover} alt="" loading="lazy" className="h-14 w-10 shrink-0 rounded-md border border-line object-cover" />
      )}
      {n.type === "follow" && (
        <button
          onClick={onFollowBack}
          aria-pressed={followingBack}
          className={`shrink-0 rounded-full px-5 py-2 text-xs font-semibold transition ${
            followingBack ? "border border-line text-ink" : "bg-brand text-[#14181F] hover:brightness-110"
          }`}
        >
          {followingBack ? "Following" : "Follow Back"}
        </button>
      )}
      {n.type === "comment" && (
        <span className="hidden shrink-0 rounded-lg border border-line p-2 text-muted sm:block">
          <MessageSquare size={15} />
        </span>
      )}

      <div className="relative shrink-0" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Notification options"
          className="rounded-md p-1.5 text-muted transition hover:bg-brand/10 hover:text-ink"
        >
          <MoreHorizontal size={18} />
        </button>
        {open && (
          <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-line bg-surface p-1 shadow-xl">
            <button
              role="menuitem"
              onClick={() => {
                onToggleRead();
                setOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs text-ink hover:bg-brand/10"
            >
              Mark as {n.read ? "unread" : "read"}
            </button>
            <button role="menuitem" onClick={onDelete} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-error hover:bg-error/10">
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
