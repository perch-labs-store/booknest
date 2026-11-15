import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { COMPANY } from "../data/company";
import type { Block, LegalKind, Theme } from "../data/templates";

export const LEGAL_TITLES: Record<LegalKind, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Use",
  cookies: "Cookie Policy",
};

/** The site's name and public contact email, read from the author's own page. */
export function siteIdentity(blocks: Block[], fallbackName: string): { name: string; email?: string } {
  const footer = blocks.find((b) => b.type === "footer");
  const name = footer?.title?.trim() || fallbackName.trim() || "this website";
  const contact = blocks.find((b) => b.type === "contact");
  const email = contact?.items
    ?.map((i) => i.text.trim())
    .find((t) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) && !/@example\.com$/i.test(t));
  return { name, email };
}

interface Props {
  kind: LegalKind;
  theme: Theme;
  name: string;
  email?: string;
  onBack: () => void;
}

const P = ({ children }: { children: ReactNode }) => <p className="leading-relaxed opacity-80">{children}</p>;
const H = ({ children }: { children: ReactNode }) => <h2 className="mt-10 text-lg font-bold">{children}</h2>;
const UL = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-1.5 pl-5 leading-relaxed opacity-80">
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

/** Plain-language Privacy, Terms and Cookie pages for an author's website. General template text, not legal advice. */
export default function LegalPage({ kind, theme, name, email, onBack }: Props) {
  const { product: APP, name: ORG } = COMPANY;
  const reach = email ? (
    <a href={`mailto:${email}`} className="underline underline-offset-4" style={{ color: theme.accent }}>
      {email}
    </a>
  ) : (
    <>the contact details on the main page</>
  );
  const heading = theme.font === "serif" ? "font-bold tracking-tight" : "font-extrabold tracking-tight";

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4 @3xl:px-10" style={{ borderColor: `${theme.ink}1f` }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <span className="text-lg font-bold" style={{ color: theme.accent }}>
            {name}
          </span>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline hover:underline-offset-4" style={{ color: theme.accent }}>
            <ArrowLeft size={16} /> Back to site
          </button>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-14 @3xl:px-10">
        <h1 className={`text-3xl @3xl:text-4xl ${heading}`}>{LEGAL_TITLES[kind]}</h1>
        <p className="mt-2 text-sm opacity-60">{name}</p>

        {kind === "privacy" && (
          <div className="mt-6 flex flex-col gap-4">
            <P>
              This page explains what happens to your information when you visit {name}'s website. In short: we keep it simple and collect very little.
            </P>
            <H>Who runs this site</H>
            <P>
              This website is run by {name} ("we", "us"). You can reach us at {reach}. The site is built and hosted with {APP}, a service from {ORG}.
            </P>
            <H>What we collect</H>
            <P>This website does not ask you to create an account and does not collect personal information through the page itself.</P>
            <UL
              items={[
                "Like any website, the servers that deliver it can see technical details such as your IP address, browser type and the pages you request. This is used to run and protect the site.",
                "If you email us, we receive your email address and whatever you write, and we use it only to reply.",
                "If you click a link to another website, that website has its own privacy policy and we are not responsible for it.",
              ]}
            />
            <H>Advertising and tracking</H>
            <P>We do not sell your information, show ads, or use advertising trackers on this website.</P>
            <H>Your choices</H>
            <P>You can ask us what we hold about you, ask us to correct it, or ask us to delete it by getting in touch at {reach}.</P>
            <H>Changes</H>
            <P>We may update this page from time to time. The version on this site is always the current one.</P>
          </div>
        )}

        {kind === "terms" && (
          <div className="mt-6 flex flex-col gap-4">
            <P>By using {name}'s website you agree to these simple terms. If you don't agree, please don't use the site.</P>
            <H>Our content</H>
            <P>
              The text, images, book covers and other material on this site belong to {name} or the people credited, and are protected by copyright. You may read and share links to the site. Please don't copy, republish or sell our content without asking first.
            </P>
            <H>Using the site</H>
            <UL
              items={[
                "Use the site lawfully and respectfully.",
                "Don't try to break, overload or gain unauthorised access to the site.",
                "Don't use the site to send spam or harmful material.",
              ]}
            />
            <H>Books, prices and links</H>
            <P>Information about books, prices, events and availability may change without notice. Links to shops and other websites are provided for convenience; we don't control them and aren't responsible for what they say or sell.</P>
            <H>No guarantees</H>
            <P>We work to keep the site accurate and available, but it is provided "as is", without promises that it will always be error-free or uninterrupted. To the fullest extent allowed by law, we are not liable for losses arising from using the site.</P>
            <H>Contact</H>
            <P>Questions about these terms? Reach us at {reach}.</P>
          </div>
        )}

        {kind === "cookies" && (
          <div className="mt-6 flex flex-col gap-4">
            <P>Cookies are small files a website can store in your browser. Here is how {name}'s website uses them.</P>
            <H>What we use</H>
            <P>This website does not use cookies for tracking, analytics or advertising, so there is no cookie banner to accept.</P>
            <H>Third-party content</H>
            <P>If you follow a link to another website (for example a bookshop or a social network), that website may set its own cookies. Please check its cookie policy.</P>
            <H>Your browser</H>
            <P>You can block or delete cookies in your browser settings at any time. The site will keep working.</P>
            <H>Questions</H>
            <P>Get in touch at {reach}.</P>
          </div>
        )}
      </article>
    </div>
  );
}
