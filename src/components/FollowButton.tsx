import { Check, Plus } from "lucide-react";

interface Props {
  following: boolean;
  onToggle: () => void;
  className?: string;
}

export default function FollowButton({ following, onToggle, className = "" }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={following}
      className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
        following
          ? "border border-line bg-transparent text-ink hover:border-error hover:text-error"
          : "bg-brand text-[#14181F] hover:brightness-110"
      } ${className}`}
    >
      {following ? <Check size={14} /> : <Plus size={14} />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
