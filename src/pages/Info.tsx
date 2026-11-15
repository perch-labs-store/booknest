import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Bell, Check, Copy, Mail, Search, ShieldAlert, Smartphone, Sparkles, Users, UserCog, Lock, Handshake, Copyright as CopyrightIcon, LayoutTemplate, type LucideIcon } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { COMPANY } from "../data/company";

const { product: APP, name: ORG, email: EMAIL, governingLaw, lastUpdated } = COMPANY;

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

/** Back to the page the reader came from (e.g. Settings), or to Settings when this page was opened directly. */
function BackButton() {
  const navigate = useNavigate();
  const { key } = useLocation();
  return (
    <button
      type="button"
      onClick={() => (key === "default" ? navigate("/settings") : navigate(-1))}
      className="mb-4 inline-flex items-center gap-1.5 rounded-full py-1.5 pr-3 text-sm font-medium text-muted hover:text-ink"
    >
      <ArrowLeft size={16} /> Back
    </button>
  );
}

function Doc({ title, subtitle, updated, wide, children }: { title: string; subtitle?: string; updated?: boolean; wide?: boolean; children: ReactNode }) {
  return (
    <>
      <BackButton />
      <PageHeader title={title} subtitle={subtitle} />
      {updated && <p className="-mt-3 mb-6 text-xs text-muted">Last updated: {lastUpdated}</p>}
      <article className={`${wide ? "max-w-4xl" : "max-w-2xl"} space-y-7 text-sm leading-relaxed text-ink/90`}>{children}</article>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-serif text-lg font-bold text-ink">{title}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

const A = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="text-accent hover:underline">{children}</Link>
);
const Mailto = ({ subject, children }: { subject?: string; children?: ReactNode }) => (
  <a href={`mailto:${EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`} className="text-accent hover:underline">{children ?? EMAIL}</a>
);
const B = ({ children }: { children: ReactNode }) => <strong className="text-ink">{children}</strong>;
const List = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc space-y-1.5 pl-5 marker:text-muted">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>
);
const Callout = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-2xl border border-line bg-surface p-4">
    <p className="mb-1.5 font-semibold text-ink">{title}</p>
    <div className="space-y-2">{children}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BookOpen, title: "A home for every book", text: "A clean page for each book with its cover, description, genres, ratings and buy links." },
  { icon: Users, title: "Author pages & following", text: "Authors get a public profile. Readers follow the ones they love and see what's new." },
  { icon: Search, title: "Easy discovery", text: "Browse genres, new releases and top authors, or search by title, author or topic." },
  { icon: Sparkles, title: "Discounts, clearly shown", text: "Authors can run a time-limited discount with a code, and readers spot it with a badge." },
  // TODO(payments): bring this back together with "Become verified".
  // { icon: BadgeCheck, title: "Verified authors", text: "Authors can ask for the blue tick so readers know they're on the real page." },
  { icon: LayoutTemplate, title: "Author website templates", text: "Pick a template and build a simple author website without writing any code." },
  { icon: Bell, title: "Live notifications", text: "Optional notifications for likes, new followers and updates from the authors you follow." },
  { icon: Smartphone, title: "Install it like an app", text: "Fablebook works in your browser and can be added to your home screen, no app store needed." },
];

export function About() {
  return (
    <Doc wide title={`About ${APP}`} subtitle="A free place for authors to list their books and for readers to find their next favorite.">
      <Section title="Why Fablebook exists">
        <p>
          There are millions of books and not enough good places to discover them, especially from independent and self-published authors.
          Big stores bury small authors in search results, and authors end up juggling a website, a profile on every store and a pile of links.
        </p>
        <p>
          {APP} gives each author one tidy home for their books and sends readers straight to the store the author chooses. We don't take a cut,
          because we don't sell anything. We just help the right readers find the right books.
        </p>
      </Section>

      <Section title="How it works">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Authors list a book", "Add a cover, description, genre and links to wherever it's sold: Amazon, another store, printed, eBook or audiobook."],
            ["2", "Readers discover it", "People browse genres and new releases, search, read reviews and follow authors they like."],
            ["3", "Readers buy from the author's store", "Tap Buy and you're taken to the store the author picked. The purchase happens there, not on Fablebook."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl border border-line bg-surface p-4">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/25 text-xs font-bold text-ink">{n}</span>
              <p className="mt-2.5 font-semibold text-ink">{t}</p>
              <p className="mt-1 text-xs text-muted">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="What you can do here">
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/20 text-accent"><Icon size={18} /></span>
              <div>
                <p className="font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-xs text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="For authors">
        <p>
          Create a free account, then use <A to="/add-book">Add a Book</A> to list your first title. Fill in your profile so readers know who you are,
          pin your best book to the top of your page, post updates for your followers, reply to reviews, and request the verified badge once you've
          published a book. You keep full control: edit or remove your books and profile whenever you like.
        </p>
      </Section>

      <Section title="For readers">
        <p>
          Explore <A to="/genres">genres</A>, check the <A to="/new-releases">new releases</A>, meet the <A to="/top-authors">top authors</A>, and use
          <A to="/search"> search</A> to find something specific. Like and save books, follow authors, and leave an honest review to help others.
        </p>
      </Section>

      <Section title="What we believe">
        <List
          items={[
            <><B>Authors come first.</B> Your books, your links, your readers. We stay out of the middle.</>,
            <><B>Honest and simple.</B> No pay-to-rank, no hidden fees, no selling your data.</>,
            <><B>Independent voices matter.</B> Great books don't need a big publisher to be found.</>,
            <><B>Safe and respectful.</B> We remove spam, fake reviews, harassment and stolen work. See the <A to="/terms">Terms of Service</A>.</>,
          ]}
        />
      </Section>

      <Section title="Who's behind it">
        <p>
          {APP} is built and run by <B>{ORG}</B>, a small independent project run by one person. It isn't a registered company, and it's still growing.
          That means we move fast and listen closely, but it also means replies can take a few days and things can occasionally break.
          Thank you for your patience and for being early.
        </p>
      </Section>

      <Section title="Say hello">
        <p>
          Found a bug, have an idea, or want to work together? Visit <A to="/contact">Contact Us</A> or email <Mailto />. We read every message.
        </p>
      </Section>
    </Doc>
  );
}

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

const TOPICS: { icon: LucideIcon; title: string; text: string; subject: string }[] = [
  { icon: Mail, title: "General help & feedback", text: "Questions, ideas or something not working.", subject: `${APP} support` },
  { icon: ShieldAlert, title: "Report a listing or user", text: "Spam, fake reviews, harassment, scams or anything that breaks the Terms.", subject: `${APP} report` },
  { icon: CopyrightIcon, title: "Copyright complaint", text: "You own a work that's been listed without permission.", subject: `${APP} copyright notice` },
  { icon: Lock, title: "Privacy & data requests", text: "Access, correct or delete your data, or ask a privacy question.", subject: `${APP} privacy request` },
  { icon: UserCog, title: "Account & verification", text: "Can't sign in, or a question about the verified badge.", subject: `${APP} account help` },
  { icon: Handshake, title: "Partnerships & press", text: "Collaborations, publishers, media and anything else.", subject: `${APP} partnership` },
];

export function Contact() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the address is still shown on screen */
    }
  };

  return (
    <Doc wide title="Contact Us" subtitle="Questions, feedback or a problem? We'd like to hear from you.">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Email us</p>
        <p className="mt-1 break-all font-serif text-xl font-bold text-ink sm:text-2xl">{EMAIL}</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-[#14181F] transition hover:brightness-110">
            <Mail size={16} /> Send an email
          </a>
          <button onClick={copy} className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 font-semibold text-ink transition hover:bg-brand/10">
            {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy address</>}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          {ORG} is a one-person project, so please allow a few days for a reply. Urgent safety or copyright issues are looked at first.
        </p>
      </section>

      <Section title="What can we help with?">
        <div className="grid gap-3 sm:grid-cols-2">
          {TOPICS.map(({ icon: Icon, title, text, subject }) => (
            <a
              key={title}
              href={`mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`}
              className="flex gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand hover:bg-brand/10"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/20 text-accent"><Icon size={18} /></span>
              <span>
                <span className="block font-semibold text-ink">{title}</span>
                <span className="mt-0.5 block text-xs text-muted">{text}</span>
              </span>
            </a>
          ))}
        </div>
      </Section>

      <Section title="Help us help you faster">
        <List
          items={[
            <>For a <B>problem with a page</B>, include its link and what's wrong.</>,
            <>For a <B>bug</B>, tell us what you did, what you expected, and your device and browser.</>,
            <>For an <B>account or data request</B>, write from the email address on your account so we can confirm it's you.</>,
            <>For a <B>copyright complaint</B>, follow the steps in section 8 of the <A to="/terms">Terms of Service</A>.</>,
          ]}
        />
      </Section>

      <Section title="Good to know">
        <p>
          We can't help with orders, shipping, refunds or prices. Those are handled by the store you bought from, since {APP} doesn't sell books.
          We'll never ask for your password by email.
        </p>
      </Section>
    </Doc>
  );
}

/* ------------------------------------------------------------------ */
/* Privacy Policy                                                      */
/* ------------------------------------------------------------------ */

export function Privacy() {
  return (
    <Doc updated title="Privacy Policy" subtitle={`How ${APP} collects, uses and protects your information.`}>
      <Callout title="The short version">
        <List
          items={[
            "We collect only what we need to run your account and the features you use.",
            "We don't sell your personal information and we don't show ads.",
            "What you put on your public profile, books and reviews is public.",
            "You can edit your information any time and ask us to delete it.",
          ]}
        />
      </Callout>

      <Section title="1. Who we are">
        <p>
          {APP} is run by <B>{ORG}</B>, an independent project operated by an individual (not a registered company). In this policy, "we", "us" and "our" mean {ORG}.
          For any privacy question, email <Mailto subject={`${APP} privacy request`} />.
        </p>
      </Section>

      <Section title="2. What we collect">
        <p><B>Account information.</B> Your email address and password (or your Google account details if you sign in with Google), and your name. Sign-in is handled by our authentication provider, Clerk. We never see or store your password in plain text.</p>
        <p><B>Public profile and listings.</B> Your author name, username, bio, about text, genres, languages, location, website, social links, profile photo, cover banner, books (titles, covers, descriptions, genres, ISBN, publisher, buy links, discounts), and posts you write. This is shown publicly.</p>
        <p><B>Reviews and replies.</B> Ratings, review text and replies are public, shown with your author name and photo.</p>
        <p><B>Private information.</B> Your real name (if you add it), your verification request and note, your settings, and the website you build from a template are visible only to you (and to us where needed to run the service, such as reviewing a verification request).</p>
        <p><B>Activity.</B> The authors you follow and the books you like or save are stored so features work. Only you can see which ones; others only see totals (for example, "120 likes").</p>
        <p><B>Notifications.</B> We keep the notifications we send you inside the app (likes, follows, updates). If you turn on push notifications, we also store a technical subscription for your device (a web address and encryption keys from your browser's push service) so we can reach it.</p>
        <p><B>Technical data.</B> Like most websites, our providers see your IP address, browser and device type when you connect. We don't use advertising trackers or third-party analytics.</p>
      </Section>

      <Section title="3. How we use it">
        <List
          items={[
            "To create and run your account and show your public profile, books and reviews.",
            "To provide features such as following, likes, saves, reviews and notifications.",
            "To send service messages, like sign-in verification codes and, if you opt in, push notifications.",
            "To review verification requests and keep the community safe (preventing spam, fraud and abuse).",
            "To fix bugs and improve Fablebook.",
            "To meet legal obligations and to protect our rights.",
          ]}
        />
        <p>We don't sell your personal information, and we don't use it to build advertising profiles.</p>
      </Section>

      <Section title="4. Who we share it with">
        <p>We share data only with the services that help us run {APP}, and only as needed:</p>
        <List
          items={[
            <><B>Clerk</B> for sign-up, sign-in and account security.</>,
            <><B>Supabase</B> for our database and image storage.</>,
            <><B>Google Fonts</B> to load the typefaces on this site (your browser contacts Google to download them).</>,
            <><B>Browser push services</B> (run by Google, Apple, Mozilla or Microsoft, depending on your browser) to deliver push notifications you've turned on.</>,
            <><B>Authorities or other parties</B> if the law requires it, or to protect people's safety or our legal rights.</>,
          ]}
        />
        <p>Anything you make public can be seen by anyone, including search engines, and may be copied by others. Please don't post anything you want to keep private.</p>
      </Section>

      <Section title="5. Cookies and on-device storage">
        <p>
          Our sign-in provider uses cookies to keep you signed in. {APP} also stores small settings on your device, such as your light/dark theme, whether you dismissed
          a prompt, and a draft of a website you're editing. The installable app also keeps a cache of pages and images so it loads fast and works offline.
          You can clear all of this in your browser settings.
        </p>
      </Section>

      <Section title="6. Push notifications">
        <p>
          Push notifications are optional and off until you agree in your browser. You can turn them off any time in Settings on your profile or in your browser or phone's
          site settings. When you turn them off, we remove your device's subscription.
        </p>
      </Section>

      <Section title="7. Links to other sites">
        <p>
          Buy links, author websites and social links take you to sites run by others, such as Amazon. We don't control them and aren't responsible for their privacy
          practices. Read their policies before you share anything.
        </p>
      </Section>

      <Section title="8. How long we keep it">
        <p>
          We keep your information while your account is active. If you delete a book, its listing, links, likes and reviews are removed with it. If you ask us to delete your
          account, we'll delete or anonymize your personal information within a reasonable time, except what we must keep for legal reasons or to prevent abuse. Backups may
          hold data for a short while longer.
        </p>
      </Section>

      <Section title="9. Your choices and rights">
        <p>You can edit your profile, books and settings at any time. Depending on where you live (for example, under the Kenya Data Protection Act, the GDPR or similar laws), you may also have the right to:</p>
        <List
          items={[
            "ask for a copy of the personal information we hold about you,",
            "correct information that's wrong or out of date,",
            "ask us to delete your information,",
            "object to or limit certain uses, and withdraw consent you've given.",
          ]}
        />
        <p>
          To use any of these rights, email <Mailto subject={`${APP} privacy request`} /> from the address on your account. We may need to confirm it's you first.
          If you're unhappy with our response, you can complain to your local data protection authority.
        </p>
      </Section>

      <Section title="10. Security">
        <p>
          We use trusted providers, encrypted connections (HTTPS) and access rules so people can only change their own data. No service is perfectly secure, so we
          can't guarantee absolute security. Please use a strong, unique password.
        </p>
      </Section>

      <Section title="11. Children">
        <p>
          {APP} isn't meant for children under 13, and we don't knowingly collect their information. If you think a child has given us personal information, email us and
          we'll delete it. If your country sets a higher minimum age for online services, you must meet that age.
        </p>
      </Section>

      <Section title="12. Where your data goes">
        <p>
          Our providers may store and process data in countries other than yours. By using {APP} you understand that your information may be transferred there, and we
          choose providers that protect it with appropriate safeguards.
        </p>
      </Section>

      <Section title="13. Changes to this policy">
        <p>
          We may update this policy as {APP} grows. We'll change the "Last updated" date above and, for important changes, tell you in the app. Continuing to use {APP}
          after a change means you accept it.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>Questions about privacy? Email <Mailto subject={`${APP} privacy request`} /> or visit <A to="/contact">Contact Us</A>.</p>
      </Section>
    </Doc>
  );
}

/* ------------------------------------------------------------------ */
/* Terms of Service                                                    */
/* ------------------------------------------------------------------ */

export function Terms() {
  return (
    <Doc updated title="Terms of Service" subtitle={`The rules for using ${APP}.`}>
      <Callout title="Please read this">
        <p>
          By creating an account or using {APP}, you agree to these terms and to our <A to="/privacy">Privacy Policy</A>. If you don't agree, please don't use {APP}.
          These terms limit our responsibility, so read sections 10 to 12 carefully.
        </p>
      </Callout>

      <Section title="1. Who we are">
        <p>
          {APP} is provided by <B>{ORG}</B>, an independent project run by an individual. It isn't a registered company. "We", "us" and "our" mean {ORG}.
          Contact: <Mailto />.
        </p>
      </Section>

      <Section title="2. What Fablebook is, and isn't">
        <p>
          {APP} is a free directory where authors list books and readers discover them. We <B>don't sell, host, publish, print or deliver books</B>, we don't process
          payments, and we're <B>not a party to any purchase</B> you make. When you tap Buy, you leave {APP} for a store run by someone else. Prices, availability, delivery,
          refunds and support are that store's responsibility.
        </p>
        <p>
          We don't check, edit or endorse the books, authors, reviews or links on {APP}, and we can't promise they're accurate, safe or suitable for you. Use your own
          judgment, especially before buying or sharing personal or payment details on another site.
        </p>
      </Section>

      <Section title="3. Your account">
        <List
          items={[
            "You must be at least 13 years old (or older if your country requires it), and able to form a binding agreement. If you're under 18, a parent or guardian should agree to these terms for you.",
            "Give accurate information and keep it up to date. Don't pretend to be someone else.",
            "Keep your password safe. You're responsible for everything that happens under your account. Tell us right away if you think it's been misused.",
            "One person, one account. Don't sell, share or transfer your account.",
          ]}
        />
      </Section>

      <Section title="4. Your content">
        <p>
          "Your content" means anything you post: your profile, books, covers, descriptions, links, discounts, posts, reviews and replies. <B>You keep ownership</B> of it.
        </p>
        <p>
          By posting, you give {ORG} a free, worldwide, non-exclusive licence to host, store, display, reproduce, resize and distribute your content on and in connection with
          {" "}{APP} (including in the installable app and in previews or links you share), for as long as it's on {APP}. This licence lets us run the service; it doesn't
          transfer your ownership.
        </p>
        <p>You promise that:</p>
        <List
          items={[
            "you own your content or have all the rights and permissions needed to post it (including covers, images and text);",
            "it's accurate and not misleading, and your buy links lead where you say they do;",
            "it doesn't break the law or anyone's rights, including copyright, trademark, privacy and publicity rights.",
          ]}
        />
        <p>
          <B>Discounts.</B> A discount or code you add is information you provide. You're responsible for making sure it's real and available where you sell, and for removing it when
          it ends. We don't verify, honor or guarantee discounts.
        </p>
      </Section>

      <Section title="5. Reviews">
        <p>
          Reviews are opinions of the people who write them, not of {ORG}. Write honestly and only about books you've actually read or tried. Authors can't review their own books
          and shouldn't ask for or pay for fake reviews. We may remove reviews that break these terms.
        </p>
      </Section>

      <Section title="6. Verified badge">
        <p>
          The verified badge means we've reviewed an author's request and are reasonably satisfied that the page belongs to the person or publisher it claims to represent.
          It isn't an endorsement, and it doesn't guarantee the quality or accuracy of the books or links. We can grant or remove the badge at our discretion, including if
          information turns out to be false.
        </p>
      </Section>

      <Section title="7. What's not allowed">
        <p>You agree not to:</p>
        <List
          items={[
            "post content you don't have the rights to, or that is illegal, defamatory, hateful, sexually explicit, violent or harassing;",
            "post spam, scams, malware, misleading or harmful links, or fake or paid-for reviews and follows;",
            "harass, threaten, impersonate or target others;",
            "collect other people's data without permission, or scrape the service in bulk;",
            "interfere with, probe, overload or try to break or bypass the security of the service;",
            "use the service to promote anything illegal, or in a way that breaks any law.",
          ]}
        />
      </Section>

      <Section title="8. Copyright and takedown notices">
        <p>
          We respect creators' rights. If you believe content on {APP} infringes your copyright, email <Mailto subject={`${APP} copyright notice`} /> with:
        </p>
        <List
          items={[
            "your name and contact details,",
            "a description of the work you own,",
            "the link(s) to the content on Fablebook you want reviewed,",
            "a statement that you believe in good faith the use isn't authorized, and that your notice is accurate,",
            "a statement that you're the owner or authorized to act for the owner, and your signature (typing your full name is fine).",
          ]}
        />
        <p>
          We may remove or disable access to the content, tell the person who posted it, and share your notice with them. If someone believes content was removed by mistake, they can
          send us a counter-notice at the same address. We may close the accounts of people who repeatedly infringe. Knowingly sending a false notice can have legal consequences.
        </p>
      </Section>

      <Section title="9. Third-party sites and services">
        <p>
          {APP} links to other websites and relies on services run by others (such as Clerk and Supabase). We don't control them and aren't responsible for their content,
          availability, products or policies. Your dealings with them are between you and them.
        </p>
      </Section>

      <Section title="10. No warranties">
        <p>
          {APP} is provided <B>"as is" and "as available"</B>, free of charge, without warranties of any kind, express or implied, including about accuracy, reliability,
          availability, fitness for a particular purpose or non-infringement. We don't promise the service will always work, be secure or be free of errors, or that content
          (including data you add) will never be lost. Keep your own copy of anything important, like your book descriptions and cover images.
        </p>
      </Section>

      <Section title="11. Limit of liability">
        <p>
          To the fullest extent the law allows, {ORG} and the person behind it won't be liable for any indirect, incidental, special, consequential or punitive damages, or for
          any loss of profits, sales, data, goodwill or reputation, arising from or related to your use of (or inability to use) {APP}, content posted by users, or purchases or
          dealings with other sites reached through links on {APP}.
        </p>
        <p>
          Because {APP} is free, our total liability for any claim related to the service is limited to the greater of (a) the amount you paid us in the last 12 months (likely
          zero) or (b) USD 50. Some places don't allow certain limits, so parts of this section may not apply to you. Nothing here limits liability that can't legally be limited.
        </p>
      </Section>

      <Section title="12. You agree to cover us">
        <p>
          To the extent the law allows, you agree to defend and reimburse {ORG} for claims, losses and costs (including reasonable legal fees) that come from content you post,
          your breach of these terms, or your violation of someone else's rights or the law.
        </p>
      </Section>

      <Section title="13. Removing content, suspending accounts, ending service">
        <p>
          We may remove content, limit features, or suspend or close accounts at any time, with or without notice, especially for breaking these terms or putting others at risk.
          You can stop using {APP} at any time and ask us to delete your account (see the <A to="/privacy">Privacy Policy</A>). We may also change or shut down {APP} or any feature
          at any time. We'll try to give notice of major changes, but we don't have to.
        </p>
      </Section>

      <Section title="14. Governing law and disputes">
        <p>
          These terms are governed by the laws of <B>{governingLaw}</B>, without regard to conflict-of-law rules. If you have a problem, please email us first at <Mailto /> and
          give us a chance to sort it out informally. If we can't, the courts of {governingLaw} have jurisdiction, except where your local consumer laws give you the right to go to
          court where you live.
        </p>
      </Section>

      <Section title="15. Changes to these terms">
        <p>
          We may update these terms as {APP} changes. We'll update the "Last updated" date and, for important changes, tell you in the app. Continuing to use {APP} after a
          change means you accept the new terms.
        </p>
      </Section>

      <Section title="16. The small print">
        <p>
          If part of these terms is found unenforceable, the rest still applies. If we don't enforce a term right away, we haven't given it up. You can't transfer your rights
          under these terms; we may transfer ours. These terms and the Privacy Policy are the whole agreement between you and us about {APP}.
        </p>
      </Section>

      <Section title="17. Contact">
        <p>Questions about these terms? Email <Mailto /> or visit <A to="/contact">Contact Us</A>.</p>
      </Section>
    </Doc>
  );
}


/* ------------------------------------------------------------------ */
/* Author resources                                                    */
/* ------------------------------------------------------------------ */

export function PublishingGuide() {
  return (
    <Doc title="Publishing Guide" subtitle={`How to list your book on ${APP} and get it discovered.`}>
      <Section title="1. Set up your author page">
        <p>
          Sign up, then open <A to="/profile">your profile</A> and choose Edit Profile. Add a pen name, username, short bio (up to 160 characters), genres, a photo and your website
          or social links. A complete page builds trust with readers.
        </p>
      </Section>
      <Section title="2. Add your book">
        <p>Go to <A to="/add-book">Add a Book</A> and fill in:</p>
        <List
          items={[
            <><B>Cover:</B> a PNG, JPG or WEBP image up to 5 MB. A tall (2:3) cover looks best.</>,
            <><B>Title, genre and description</B> (up to 2,000 characters). Write it like a back-cover blurb.</>,
            <><B>Buy links:</B> add a link for each version you sell (printed, eBook or audiobook), on Amazon or any other store. Readers buy there, not on {APP}.</>,
            <><B>Release date:</B> a future date shows the book as coming soon.</>,
            <><B>Details:</B> optional subtitle, language, ISBN and publisher.</>,
          ]}
        />
      </Section>
      <Section title="3. Draft or publish">
        <p>Save as a <B>draft</B> to keep working privately, or <B>publish</B> to make it visible to everyone. You can edit or delete a book any time from your profile.</p>
      </Section>
      <Section title="4. Run a discount (optional)">
        <p>Add a percentage, an optional end date and a code. Readers see a discount badge. Only add a discount that is really available in your store, and remove it when it ends.</p>
      </Section>
      <Section title="5. Grow your readership">
        <List
          items={[
            "Pin your best book to the top of your author page.",
            "Post updates, for example a launch date. Your followers get notified.",
            "Reply to reviews. Authors can reply but can't review their own books.",
            "Request the verified badge once you have a published book.",
          ]}
        />
      </Section>
      <p>Stuck? <A to="/contact">Contact us</A>.</p>
    </Doc>
  );
}

export function AuthorGuidelines() {
  return (
    <Doc title="Author Guidelines" subtitle={`What we expect from authors on ${APP}.`}>
      <Section title="Be honest">
        <List
          items={[
            "Only list books you wrote or have the rights to promote.",
            "Make sure covers, descriptions and links are accurate and lead where you say.",
            "Only advertise discounts that are real and still running.",
            "Don't ask for, buy or write fake reviews, and don't pay for followers.",
          ]}
        />
      </Section>
      <Section title="Respect others">
        <List
          items={[
            "No harassment, hate, threats or targeting of other people.",
            "No sexually explicit content, graphic violence or anything illegal.",
            "Reply to reviews politely, even critical ones.",
          ]}
        />
      </Section>
      <Section title="Keep readers safe">
        <p>No spam, scams, malware or misleading links. Buy links should go to a real store page for your book.</p>
      </Section>
      <Section title="What happens if rules are broken">
        <p>
          We may remove content, take away the verified badge, or suspend accounts, depending on how serious it is. The full rules are in our <A to="/terms">Terms of Service</A>.
          To report something, <A to="/contact">contact us</A>.
        </p>
      </Section>
    </Doc>
  );
}

export function Copyright() {
  return (
    <Doc title="Copyright & DMCA" subtitle={`How we handle copyright on ${APP}.`}>
      <Section title="Our approach">
        <p>
          We respect creators' rights and expect authors to list only work they own or are allowed to promote. {APP} doesn't host or sell books, but it does show covers, descriptions
          and links that authors add.
        </p>
      </Section>
      <Section title="Think something infringes your copyright?">
        <p>
          Email <Mailto subject={`${APP} copyright notice`} /> with your contact details, a description of your work, the link(s) to the content on {APP}, a good-faith statement that
          the use isn't authorized, and a statement that you own the work or may act for the owner, with your signature (typing your full name is fine).
        </p>
        <p>
          We'll review it, may remove the content, and may share your notice with the person who posted it. Full details are in section 8 of the <A to="/terms">Terms of Service</A>.
        </p>
      </Section>
      <Section title="Think we removed something by mistake?">
        <p>Email us a counter-notice at the same address and explain why you believe the content is allowed. We may restore it if appropriate.</p>
      </Section>
      <Section title="Repeat infringers">
        <p>Accounts that repeatedly infringe copyright may be suspended or closed.</p>
      </Section>
    </Doc>
  );
}
