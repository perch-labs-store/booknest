/**
 * Links typed by authors end up as real links on public pages, so every one goes through here first.
 * Only http, https, mailto and tel are allowed; javascript:, data: and anything else is rejected.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const HAS_ALLOWED_SCHEME = /^(https?|mailto|tel):/i;
// "example.com", "example.com:8080/path?x=1": a bare web address typed without https://
const BARE_ADDRESS = /^[^\s/@:?#]+\.[^\s/@:?#]{2,}(:\d{1,5})?([/?#]\S*)?$/;

/** A clean, safe URL, or null when the value isn't an allowed link. */
export function sanitizeLink(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value || value.length > 2048) return null;

  let candidate = value;
  if (!HAS_ALLOWED_SCHEME.test(value)) {
    if (!BARE_ADDRESS.test(value)) return null;
    candidate = `https://${value}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null;
  if (url.protocol === "http:" || url.protocol === "https:") {
    if (!url.hostname || url.username || url.password) return null;
  } else if (!url.pathname) {
    return null;
  }
  return url.href;
}

/** Opens a link already cleaned by sanitizeLink: web addresses in a new tab, mailto: and tel: normally. */
export function openLink(href: string): void {
  const a = document.createElement("a");
  a.href = href;
  if (/^https?:/i.test(href)) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
