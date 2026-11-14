export type SocialKey =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "x"
  | "threads"
  | "linkedin"
  | "pinterest"
  | "goodreads";

export type SocialLinks = Partial<Record<SocialKey, string>>;

interface SocialDef {
  key: SocialKey;
  label: string;
  placeholder: string;
  /** Domains a link for this platform may use. */
  hosts: string[];
  /** Builds a profile URL from a bare handle. Omitted when a handle isn't enough (paste the full link). */
  fromHandle?: (handle: string) => string;
}

export const SOCIALS: SocialDef[] = [
  { key: "instagram", label: "Instagram", placeholder: "@yourname or link", hosts: ["instagram.com"], fromHandle: (h) => `https://instagram.com/${h}` },
  { key: "tiktok", label: "TikTok", placeholder: "@yourname or link", hosts: ["tiktok.com"], fromHandle: (h) => `https://tiktok.com/@${h}` },
  { key: "youtube", label: "YouTube", placeholder: "@channel or link", hosts: ["youtube.com", "youtu.be"], fromHandle: (h) => `https://youtube.com/@${h}` },
  { key: "facebook", label: "Facebook", placeholder: "facebook.com/yourpage", hosts: ["facebook.com", "fb.com"], fromHandle: (h) => `https://facebook.com/${h}` },
  { key: "x", label: "X (Twitter)", placeholder: "@yourname or link", hosts: ["x.com", "twitter.com"], fromHandle: (h) => `https://x.com/${h}` },
  { key: "threads", label: "Threads", placeholder: "@yourname or link", hosts: ["threads.net", "threads.com"], fromHandle: (h) => `https://threads.net/@${h}` },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/…", hosts: ["linkedin.com"] },
  { key: "pinterest", label: "Pinterest", placeholder: "yourname or link", hosts: ["pinterest.com"], fromHandle: (h) => `https://pinterest.com/${h}` },
  { key: "goodreads", label: "Goodreads", placeholder: "goodreads.com/author/…", hosts: ["goodreads.com"] },
];

export const socialDef = (key: SocialKey) => SOCIALS.find((s) => s.key === key)!;

const hostMatches = (hostname: string, hosts: string[]) =>
  hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));

/**
 * Turns what an author typed (a @handle or a link) into a full https URL.
 * Returns "" for empty input and null when it isn't valid for that platform.
 */
export function normalizeSocial(key: SocialKey, raw: string): string | null {
  const def = socialDef(key);
  const value = raw.trim();
  if (!value) return "";

  const looksLikeLink = value.includes("/") || hostMatches(value.toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/)[0], def.hosts);
  if (!looksLikeLink) {
    const handle = value.replace(/^@/, "");
    if (!def.fromHandle || !/^[\w.-]{1,50}$/.test(handle)) return null;
    return def.fromHandle(handle);
  }

  try {
    const u = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return hostMatches(u.hostname.replace(/^www\./, ""), def.hosts) ? u.toString() : null;
  } catch {
    return null;
  }
}
