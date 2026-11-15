export const CATEGORIES = ["Author Site", "Book Launch", "Bookstore", "Blog & Newsletter", "Series Page", "Publisher", "Book Club"] as const;
export type Category = (typeof CATEGORIES)[number];

export type BlockType =
  | "announce"
  | "header"
  | "hero"
  | "press"
  | "stats"
  | "features"
  | "cards"
  | "authors"
  | "about"
  | "quote"
  | "testimonials"
  | "events"
  | "faq"
  | "contact"
  | "cta"
  | "footer";

export interface Item {
  title: string;
  text: string;
  /** Image id from the library (a cover or an author portrait). */
  image?: string;
  /** Small extra label, e.g. an event date like "12 DEC". */
  meta?: string;
}

export interface FooterColumn {
  title: string;
  links: string[];
}

export interface Block {
  id: string;
  type: BlockType;
  eyebrow?: string;
  title?: string;
  text?: string;
  button?: string;
  button2?: string;
  /** Where the button goes on the published site (http, https, mailto or tel). Empty = scroll to the section its label names. */
  link?: string;
  /** Same, for the second button. */
  link2?: string;
  /** Image ids (hero uses up to three, about/quote use the first). */
  images?: string[];
  items?: Item[];
  columns?: FooterColumn[];
}

export type HeroLayout = "center" | "left" | "split" | "banner";

export interface Theme {
  accent: string;
  bg: string;
  ink: string;
  font: "serif" | "sans";
  hero: HeroLayout;
  shape: "pill" | "square";
}

export interface TemplateDef {
  id: string;
  name: string;
  category: Category;
  bookId: string;
  theme: Theme;
}

/** What the editor works on and saves: the look plus the list of blocks. */
export interface SiteDoc {
  theme: Theme;
  blocks: Block[];
  /** Social media links by network id (see SocialIcons). Empty = hidden. */
  social?: Record<string, string>;
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  announce: "Announcement bar",
  header: "Header",
  press: "Press / featured in",
  stats: "Numbers",
  authors: "Meet the authors",
  testimonials: "Reviews grid",
  events: "Events",
  faq: "FAQ",
  contact: "Contact form",
  hero: "Hero",
  features: "Features",
  cards: "Books / Cards",
  about: "About the author",
  quote: "Reader quote",
  cta: "Call to action",
  footer: "Footer",
};

/* ------------------------------------------------------------------ */
/* Image library: book covers and author portraits                     */
/* ------------------------------------------------------------------ */

const fileId = (path: string) => (path.split("/").pop() ?? "").replace(/\.\w+$/, "");

const coverFiles = import.meta.glob("../assets/templates/covers/*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const portraitFiles = import.meta.glob("../assets/templates/authors/*.jpg", { eager: true, import: "default" }) as Record<string, string>;

const COVER_SRC: Record<string, string> = Object.fromEntries(Object.entries(coverFiles).map(([p, s]) => [fileId(p), s]));
const PORTRAIT_SRC: Record<string, string> = Object.fromEntries(Object.entries(portraitFiles).map(([p, s]) => [fileId(p), s]));

export interface Cover {
  id: string;
  title: string;
  authorId: string;
  genre: string;
  tagline: string;
  /** Short selling line used in cards. */
  blurb: string;
}

export const COVERS: Cover[] = [
  { id: "ember-crown", title: "The Ember Crown", authorId: "elara-vance", genre: "Fantasy", tagline: "A kingdom on fire. A crown no one dares to claim.", blurb: "An epic fantasy of dragons, dynasties and dangerous loyalties." },
  { id: "last-letter", title: "The Last Letter from You", authorId: "juliette-hart", genre: "Romance", tagline: "Some love stories never end.", blurb: "A tender, page-turning romance told in letters." },
  { id: "silent-room", title: "The Silent Room", authorId: "daniel-kellen", genre: "Thriller", tagline: "Some secrets should stay buried.", blurb: "A lakeside getaway becomes a very quiet nightmare." },
  { id: "orbital-protocol", title: "The Orbital Protocol", authorId: "ks-rathborn", genre: "Sci-Fi", tagline: "Humanity's next step wasn't supposed to be alone.", blurb: "First contact, told from a station above the Earth." },
  { id: "calmer-mind", title: "A Calmer Mind", authorId: "eleanor-gray", genre: "Self-Help", tagline: "Simple habits for a brighter life.", blurb: "Small daily practices that quietly change everything." },
  { id: "brighter-path", title: "The Brighter Path", authorId: "jonathan-reese", genre: "Biography", tagline: "The life and ideas of Alexander Hamilton.", blurb: "A fresh, readable portrait of a founding mind." },
  { id: "ember-throne", title: "The Ember Throne", authorId: "elara-vance", genre: "Fantasy", tagline: "A kingdom. A prophecy. A fallen crown.", blurb: "The sequel that burns brighter than the first." },
  { id: "forever-yours", title: "Forever Yours", authorId: "juliette-hart", genre: "Romance", tagline: "Some loves never fade.", blurb: "A sweeping love story set beneath the cherry blossoms." },
  { id: "mindset-matters", title: "Mindset Matters", authorId: "eleanor-gray", genre: "Self-Help", tagline: "Small changes. Big results.", blurb: "A practical guide to thinking, and living, differently." },
  { id: "startup-playbook", title: "The Startup Playbook", authorId: "marcus-bellamy", genre: "Business", tagline: "Build. Grow. Scale.", blurb: "The no-nonsense guide to turning an idea into a company." },
];

export interface AuthorMeta {
  id: string;
  name: string;
  first: string;
  portrait: string;
  bio: string;
}

export const AUTHORS: AuthorMeta[] = [
  { id: "elara-vance", name: "Elara Vance", first: "Elara", portrait: "clara-finch", bio: "Elara writes sweeping fantasy about power, loyalty and the prices we pay for both. When she isn't building worlds she is hiking, collecting maps and arguing with her characters." },
  { id: "juliette-hart", name: "Juliette Hart", first: "Juliette", portrait: "juliette-hart", bio: "Juliette writes romance for readers who still love a handwritten note. Her books have been translated into twelve languages and read by the sea, on trains and in bed far too late." },
  { id: "daniel-kellen", name: "Daniel Kellen", first: "Daniel", portrait: "daniel-kellen", bio: "A former journalist, Daniel writes slow-burn thrillers where the setting is as unsettling as the plot. He lives somewhere with a lot of trees and not much phone signal." },
  { id: "ks-rathborn", name: "K. S. Rathborn", first: "K. S.", portrait: "theodore-hale", bio: "K. S. writes science fiction grounded in real engineering and real emotion. Their stories ask what we would do if the universe finally answered back." },
  { id: "eleanor-gray", name: "Eleanor Gray", first: "Eleanor", portrait: "eleanor-gray", bio: "Eleanor is a writer and mindfulness teacher. Her books turn big ideas about focus and calm into small habits anyone can start today." },
  { id: "jonathan-reese", name: "Jonathan Reese", first: "Jonathan", portrait: "jonathan-reese", bio: "Jonathan is a historian and storyteller who believes the past is best read like a novel. His biographies are meticulously researched and impossible to put down." },
  { id: "marcus-bellamy", name: "Marcus Bellamy", first: "Marcus", portrait: "marcus-bellamy", bio: "Marcus has founded three companies and failed at two of them. He writes honestly about what actually works when you are building something from nothing." },
];

export const AUTHOR_PORTRAIT_IDS = [
  "alistair-whitmore",
  "juliette-hart",
  "daniel-kellen",
  "margaret-ellison",
  "amara-okafor",
  "jonathan-reese",
  "eleanor-gray",
  "elias-brooks",
  "theodore-hale",
  "clara-finch",
  "marcus-bellamy",
  "hana-sato",
];

const title = (id: string) => id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

export type ImageKind = "cover" | "author";

/** A picture the author uploaded: stored as its address plus "#cover" or "#author" (the shape it was added as). */
export const isUploadedImage = (id: string | undefined): id is string => Boolean(id && /^https?:\/\//i.test(id));
export const uploadedImageValue = (url: string, kind: ImageKind) => `${url.split("#")[0]}#${kind}`;
export const uploadedImageUrl = (id: string) => id.split("#")[0];

export const imageSrc = (id: string | undefined) => (isUploadedImage(id) ? id : id ? COVER_SRC[id] ?? PORTRAIT_SRC[id] ?? "" : "");
export const imageKind = (id: string | undefined): ImageKind =>
  isUploadedImage(id) ? (id.endsWith("#author") ? "author" : "cover") : id && PORTRAIT_SRC[id] ? "author" : "cover";
export const imageLabel = (id: string) => COVERS.find((c) => c.id === id)?.title ?? title(id);
export const IMAGE_LIBRARY: Record<ImageKind, { id: string; label: string }[]> = {
  cover: COVERS.map((c) => ({ id: c.id, label: c.title })),
  author: AUTHOR_PORTRAIT_IDS.map((id) => ({ id, label: title(id) })),
};

const findCover = (id: string) => COVERS.find((c) => c.id === id) ?? COVERS[0];
const findAuthor = (id: string) => AUTHORS.find((a) => a.id === id) ?? AUTHORS[0];

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 9);

/** Look that matches each genre of cover artwork. */
const GENRE_THEME: Record<string, Pick<Theme, "accent" | "bg" | "ink" | "font">> = {
  Fantasy: { accent: "#d9a94e", bg: "#15110f", ink: "#f4ead7", font: "serif" },
  Romance: { accent: "#c13f5e", bg: "#fff6f3", ink: "#3a1f25", font: "serif" },
  Thriller: { accent: "#5ea5dd", bg: "#0d1520", ink: "#e9eef4", font: "sans" },
  "Sci-Fi": { accent: "#4cb4ff", bg: "#070b1a", ink: "#e7edff", font: "sans" },
  "Self-Help": { accent: "#3f6b4f", bg: "#f7f1e3", ink: "#1f2d26", font: "serif" },
  Biography: { accent: "#8a6a3b", bg: "#f1e8d8", ink: "#2b2218", font: "serif" },
  Business: { accent: "#e2b34d", bg: "#0b1220", ink: "#f6f1e5", font: "sans" },
};

const HEROES: HeroLayout[] = ["center", "left", "split", "banner"];

const NAMES: Record<Category, string[]> = {
  "Author Site": ["Ember", "Rosewood", "Noir", "Meridian", "Verse"],
  "Book Launch": ["Debut", "Premiere", "Spotlight", "Bestseller", "Headline"],
  Bookstore: ["Shelf", "Bookshop", "Emporium", "Corner", "Atlas"],
  "Blog & Newsletter": ["Chapter", "Margin", "Dispatch", "Quill", "Folio"],
  "Series Page": ["Saga", "Trilogy", "Odyssey", "Realm", "Legend"],
  Publisher: ["Imprint", "House", "Press", "Atelier"],
  "Book Club": ["Circle", "Salon", "Bookworm", "Fireside"],
};

const MULTI_BOOK = COVERS.filter((c) => COVERS.filter((o) => o.authorId === c.authorId).length > 1);

export const TEMPLATES: TemplateDef[] = CATEGORIES.flatMap((category, ci) =>
  NAMES[category].map((name, i) => {
    const n = ci * 5 + i;
    // Author sites and series pages look best with an author who has several books.
    const pool = category === "Author Site" || category === "Series Page" ? MULTI_BOOK : COVERS;
    const book = pool[(n + ci * 3) % pool.length];
    // Every other template flips between a dark and a light version of the genre palette.
    const base = GENRE_THEME[book.genre];
    const isDark = parseInt(base.bg.slice(1, 3), 16) < 100;
    const flip = i % 2 === 1;
    const colors = !flip ? base : isDark ? { ...base, bg: "#faf7f2", ink: "#1c1a17" } : { ...base, bg: "#16131a", ink: "#f3eee6" };
    return {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      category,
      bookId: book.id,
      theme: {
        ...colors,
        hero: HEROES[n % 4],
        shape: (n % 4 === 1 ? "square" : "pill") as Theme["shape"],
      },
    };
  }),
);

export const findTemplate = (id: string | undefined) => TEMPLATES.find((t) => t.id === id);

/** Everything the starter copy is built from. */
export interface Ctx {
  category: Category;
  brand: string;
  book: Cover;
  more: Cover[];
  author: AuthorMeta;
  reviewer: { name: string; role: string; image: string; quote: string };
  reviewers: { name: string; role: string; image: string; quote: string }[];
  authors: AuthorMeta[];
}

const REVIEWERS = [
  { name: "Amara Okafor", role: "Book reviewer", image: "amara-okafor", quote: "I started it on a Friday night and finished it before sunrise. Utterly gripping from the first page." },
  { name: "Theodore Hale", role: "Bookshop owner", image: "alistair-whitmore", quote: "The book we recommend most often, and the one customers come back to thank us for." },
  { name: "Hana Sato", role: "Literary blogger", image: "hana-sato", quote: "Beautifully written, impossible to put down, and it stayed with me for weeks." },
  { name: "Margaret Ellison", role: "Book club host", image: "margaret-ellison", quote: "Our whole book club loved it. It's rare for twelve people to agree on anything!" },
];

export function ctxFor(t: TemplateDef): Ctx {
  const book = findCover(t.bookId);
  const at = COVERS.indexOf(book);
  // Prefer the same author's other books, then fill up with the rest of the library.
  const others = COVERS.filter((c) => c.id !== book.id);
  const more = [...others.filter((c) => c.authorId === book.authorId), ...others.filter((c) => c.authorId !== book.authorId)].slice(0, 2);
  const author = findAuthor(book.authorId);
  const reviewer = REVIEWERS[at % REVIEWERS.length];
  const reviewers = [0, 1, 2].map((k) => REVIEWERS[(at + k) % REVIEWERS.length]);
  const authors = [author, ...[...more, ...COVERS].map((c) => findAuthor(c.authorId))].filter((a, i, all) => all.indexOf(a) === i).slice(0, 4);
  return { category: t.category, brand: `${t.name} ${t.category === "Publisher" ? "Press" : t.category === "Book Club" ? "Book Club" : "Books"}`, book, more, author, reviewer, reviewers, authors };
}

const PRICES = ["$14.99", "$12.99", "$16.99"];

export const DEFAULT_SOCIAL: Record<string, string> = {
  instagram: "https://instagram.com",
  x: "https://x.com",
  facebook: "https://facebook.com",
  goodreads: "https://goodreads.com",
};

export function newBlock(type: BlockType, ctx: Ctx): Block {
  const id = uid();
  const { book, more, author, category: cat, reviewer, reviewers, authors } = ctx;
  const trio = [book, ...more];
  const club = cat === "Book Club";
  const pub = cat === "Publisher";
  const shop = cat === "Bookstore";
  const owner = shop || pub || club ? ctx.brand : author.name;

  switch (type) {
    case "announce":
      return {
        id,
        type,
        text: shop
          ? "Free delivery on orders over $25 · Signed copies available"
          : club
            ? "New members get their first book free · Join this month"
            : cat === "Book Launch"
              ? `${book.title} is out now. Order your copy today.`
              : `New release: ${book.title} is out now`,
        button: shop || club ? "Shop now" : "Get it",
      };

    case "header": {
      const nav = shop
        ? ["Shop", "Bestsellers", "Reviews", "FAQ", "Contact"]
        : pub
          ? ["Books", "Authors", "About", "Events", "Contact"]
          : club
            ? ["This month", "Meetings", "How it works", "FAQ"]
            : cat === "Blog & Newsletter"
              ? ["Latest", "Reading list", "About", "Contact"]
              : cat === "Series Page"
                ? ["The books", "The world", "Events", "FAQ"]
                : cat === "Book Launch"
                  ? ["The book", "Reviews", "Author", "FAQ"]
                  : ["Books", "About", "Events", "Contact"];
      const brand = shop || pub || club ? ctx.brand : cat === "Blog & Newsletter" ? `${author.first}'s Journal` : cat === "Series Page" ? book.title.replace(/^The /, "") : author.name;
      const button = shop ? "Cart (0)" : club ? "Join the club" : pub ? "Submit a manuscript" : cat === "Book Launch" ? "Buy now" : "Newsletter";
      return { id, type, title: brand, button, items: nav.map((t) => ({ title: t, text: "" })) };
    }

    case "hero":
      if (cat === "Book Launch")
        return { id, type, eyebrow: `New ${book.genre.toLowerCase()} · Out now`, title: book.title, text: `${book.tagline} ${book.blurb}`, button: "Buy the book", button2: "Read an excerpt", images: [book.id] };
      if (shop)
        return { id, type, eyebrow: "New this season", title: "Find your next favourite read", text: "Hand-picked stories from independent authors, delivered to your door.", button: "Shop all books", button2: "See bestsellers", images: trio.map((b) => b.id) };
      if (cat === "Blog & Newsletter")
        return { id, type, eyebrow: "The journal", title: "Notes on writing, reading and everything in between", text: `Essays, behind-the-scenes and reading recommendations from ${author.name}. New posts every week.`, button: "Read the latest", button2: "Subscribe", images: [author.portrait] };
      if (cat === "Series Page")
        return { id, type, eyebrow: `The ${book.genre} series`, title: `${book.title}: the complete series`, text: "Three books. One unforgettable world. Start from the very beginning.", button: "Start book one", button2: "Meet the author", images: trio.map((b) => b.id) };
      if (pub)
        return { id, type, eyebrow: "Independent publisher", title: "Publishing stories that deserve to be read", text: "We champion bold new voices and bring their books to readers around the world.", button: "Browse our books", button2: "Meet our authors", images: trio.map((b) => b.id) };
      if (club)
        return { id, type, eyebrow: "A club for curious readers", title: "Read together. Talk about it. Repeat.", text: "One book a month, one lively conversation, and a community of people who love stories as much as you do.", button: "Join the club", button2: "How it works", images: trio.map((b) => b.id) };
      return { id, type, eyebrow: `${book.genre} author`, title: "Stories you'll stay up for", text: `${author.name} writes ${book.genre.toLowerCase()} for readers who love to get lost. Latest release: ${book.title}.`, button: "Explore the books", button2: `Meet ${author.first}`, images: trio.map((b) => b.id) };

    case "press":
      return {
        id,
        type,
        eyebrow: "As featured in",
        items: ["The Daily Page", "Book Weekly", "Shelf Life", "The Literary Review", "Readers' Choice"].map((title) => ({ title, text: "" })),
      };

    case "stats":
      return {
        id,
        type,
        items: shop
          ? [
              { title: "25,000+", text: "Books in stock" },
              { title: "4.9/5", text: "Customer rating" },
              { title: "48h", text: "Average delivery" },
              { title: "150+", text: "Independent authors" },
            ]
          : club
            ? [
                { title: "1,200+", text: "Members" },
                { title: "36", text: "Books read together" },
                { title: "12", text: "Cities meeting up" },
                { title: "4.9/5", text: "Member rating" },
              ]
            : pub
              ? [
                  { title: "120+", text: "Books published" },
                  { title: "30", text: "Languages" },
                  { title: "18", text: "Awards won" },
                  { title: "2M+", text: "Copies sold" },
                ]
              : [
                  { title: "2M+", text: "Copies sold" },
                  { title: "14", text: "Languages" },
                  { title: "#1", text: `${book.genre} bestseller` },
                  { title: "120+", text: "Events and signings" },
                ],
      };

    case "features":
      if (shop)
        return { id, type, eyebrow: "Why shop with us", title: "Reading made easy", items: [{ title: "Free delivery", text: "On every order over $25, anywhere in the country." }, { title: "Signed copies", text: "Many titles are signed by the author on request." }, { title: "Easy returns", text: "Changed your mind? Send it back within 30 days." }] };
      if (club)
        return { id, type, eyebrow: "How it works", title: "Three steps to a better reading life", items: [{ title: "Join for free", text: "Create your account in under a minute." }, { title: "Read the monthly pick", text: "We choose one great book every month." }, { title: "Meet and discuss", text: "Join the live conversation, online or in person." }] };
      if (cat === "Blog & Newsletter")
        return { id, type, eyebrow: "What I write about", title: "Topics", items: [{ title: "The writing life", text: "Habits, routines and honest lessons from the desk." }, { title: "What I'm reading", text: "Short reviews of books worth your time." }, { title: "Behind the books", text: "Research, drafts and how stories come together." }] };
      if (pub)
        return { id, type, eyebrow: "Our approach", title: "What makes us different", items: [{ title: "Author first", text: "Fair terms and close collaboration on every book." }, { title: "Beautifully made", text: "Design and editing to the highest standard." }, { title: "Global reach", text: "Distribution to bookshops and readers worldwide." }] };
      return { id, type, eyebrow: cat === "Series Page" ? "The world" : "Inside the book", title: cat === "Series Page" ? "A world worth getting lost in" : "Why readers love it", items: [{ title: "Unputdownable", text: "Short chapters and constant momentum keep the pages turning." }, { title: "Unforgettable characters", text: "People you will root for, argue with and miss when it ends." }, { title: "A story with heart", text: "Big ideas and real emotion, beautifully told." }] };

    case "cards":
      return {
        id,
        type,
        eyebrow: shop ? "Bestsellers" : club ? "This month's pick" : cat === "Blog & Newsletter" ? "From the shelf" : pub ? "Catalogue" : "Books",
        title: shop ? "Readers' favourites" : club ? "What we're reading" : cat === "Blog & Newsletter" ? "On my reading list" : cat === "Series Page" ? "Read in order" : pub ? "New and notable" : "Latest books",
        items: trio.map((b, i) => ({
          title: b.title,
          text: shop ? `${b.genre} · ${PRICES[i % PRICES.length]}` : cat === "Series Page" ? `Book ${i + 1} · ${b.blurb}` : club ? `${["This month", "Next month", "In two months"][i]} · ${b.genre}` : b.blurb,
          image: b.id,
        })),
      };

    case "authors":
      return {
        id,
        type,
        eyebrow: "Our authors",
        title: "Meet the writers",
        items: authors.map((a) => ({ title: a.name, text: `${findCover(COVERS.find((c) => c.authorId === a.id)?.id ?? book.id).genre} author`, image: a.portrait })),
      };

    case "about":
      return {
        id,
        type,
        eyebrow: shop ? "Our story" : pub ? "About us" : club ? "About the club" : "About the author",
        title: shop ? "A shop built by readers" : pub ? "Small team. Big love of books." : club ? "Started around a kitchen table" : `Hello, I'm ${author.first}`,
        text: shop
          ? "We started with one shelf and a love of stories. Today we help thousands of readers find books they'll never forget."
          : pub
            ? "We are a team of editors, designers and readers who believe great books change lives. Since our first title we have published bold fiction and sharp non-fiction from around the world."
            : club
              ? "What began as five friends swapping paperbacks is now a community of more than a thousand readers. We keep it friendly, curious and spoiler-aware."
              : author.bio,
        button: shop ? "Visit the shop" : "Read more",
        images: [shop || pub || club ? "margaret-ellison" : author.portrait],
      };

    case "quote":
      return { id, type, text: `“${reviewer.quote}”`, title: reviewer.name, eyebrow: reviewer.role, images: [reviewer.image] };

    case "testimonials":
      return {
        id,
        type,
        eyebrow: "Reader reviews",
        title: shop ? "Loved by readers" : "What people are saying",
        items: reviewers.map((r) => ({ title: r.name, text: r.quote, image: r.image, meta: r.role })),
      };

    case "events":
      return {
        id,
        type,
        eyebrow: club ? "Meetings" : "On tour",
        title: club ? "Upcoming meetings" : "Come and say hello",
        items: club
          ? [
              { meta: "12 DEC", title: "December discussion", text: "Online · 7:00 PM" },
              { meta: "09 JAN", title: "New year, new book", text: "Community library · 6:30 PM" },
              { meta: "13 FEB", title: "Author Q&A", text: "Online · 7:00 PM" },
            ]
          : [
              { meta: "12 DEC", title: "Book launch & signing", text: "City Library · 6:00 PM" },
              { meta: "19 DEC", title: "In conversation", text: "Literary Festival · 2:30 PM" },
              { meta: "08 JAN", title: "Reading & Q&A", text: "The Corner Bookshop · 7:00 PM" },
            ].map((e) => ({ ...e, text: e.text })),
      };

    case "faq":
      return {
        id,
        type,
        eyebrow: "FAQ",
        title: "Frequently asked questions",
        items: shop
          ? [
              { title: "How long does delivery take?", text: "Most orders arrive within 2 to 4 working days." },
              { title: "Can I get a signed copy?", text: "Yes. Choose the signed option at checkout on selected titles." },
              { title: "What is your returns policy?", text: "Return any unread book within 30 days for a full refund." },
            ]
          : club
            ? [
                { title: "Is it free to join?", text: "Yes. Membership is free and you can leave at any time." },
                { title: "Do I have to finish the book?", text: "Not at all. Come along even if you only read half." },
                { title: "Can I suggest a book?", text: "Absolutely. Members vote on the monthly pick." },
              ]
            : [
                { title: "Where can I buy the book?", text: "It's available in print, ebook and audio from all major retailers and your local bookshop." },
                { title: "Is there a signed edition?", text: "Signed copies are available during the launch period." },
                { title: "Can you visit my book club or school?", text: "I'd love to. Send a message through the contact form." },
              ],
      };

    case "contact":
      return {
        id,
        type,
        eyebrow: "Get in touch",
        title: pub ? "Let's talk about your book" : club ? "Questions? Say hello" : "Contact",
        text: pub ? "Pitching a manuscript, booking an author or press enquiry? Send us a note." : "For events, press and everything else, send a message and I'll get back to you.",
        button: "Send message",
        items: [
          { title: "Email", text: "hello@example.com" },
          { title: pub ? "Submissions" : "Press", text: pub ? "submissions@example.com" : "press@example.com" },
          { title: "Based in", text: "Nairobi, Kenya" },
        ],
      };

    case "cta":
      if (shop) return { id, type, title: "Get 10% off your first order", text: "Join our reader list for new releases, giveaways and offers.", button: "Sign me up" };
      if (club) return { id, type, title: "Join the club today", text: "Get the monthly pick, reminders and discussion guides in your inbox.", button: "Join free" };
      if (pub) return { id, type, title: "Stay in the loop", text: "New releases, author events and special offers from our catalogue.", button: "Subscribe" };
      if (cat === "Book Launch") return { id, type, title: "Read the first chapter free", text: "Enter your email and I'll send it straight to your inbox.", button: "Send me chapter one" };
      if (cat === "Series Page") return { id, type, title: "Be the first to know about the next book", text: "Release dates, covers and bonus scenes, straight to your inbox.", button: "Notify me" };
      return { id, type, title: "Join my reader list", text: "New releases, early news and a free short story. No spam, ever.", button: "Subscribe" };

    case "footer":
      return {
        id,
        type,
        title: owner,
        eyebrow: shop ? "Independent books, delivered with care." : pub ? "Publishing bold stories since day one." : club ? "A friendly home for curious readers." : `Stories by ${author.name}. Thank you for reading.`,
        text: `© ${new Date().getFullYear()} ${owner}. All rights reserved.`,
        columns: [
          { title: shop ? "Shop" : "Explore", links: shop ? ["Bestsellers", "New arrivals", "Signed copies"] : pub ? ["Books", "Authors", "About"] : club ? ["This month", "How it works", "Meetings"] : ["Books", "About", "Events"] },
          { title: "Support", links: ["FAQ", "Contact", "Reviews"] },
          { title: "Stay in touch", links: ["Newsletter", "Press", "Contact"] },
        ],
        items: ["Privacy", "Terms", "Cookies"].map((t) => ({ title: t, text: "" })),
      };
  }
}

/** Section orders for each kind of site. Templates in a category rotate through these. */
const ORDER: Record<Category, BlockType[][]> = {
  "Author Site": [
    ["announce", "header", "hero", "press", "cards", "about", "stats", "testimonials", "events", "cta", "footer"],
    ["header", "hero", "cards", "about", "quote", "faq", "contact", "footer"],
    ["header", "hero", "stats", "cards", "about", "testimonials", "press", "cta", "footer"],
    ["header", "hero", "about", "cards", "events", "quote", "contact", "cta", "footer"],
  ],
  "Book Launch": [
    ["announce", "header", "hero", "press", "features", "stats", "quote", "about", "events", "cta", "footer"],
    ["header", "hero", "features", "testimonials", "faq", "about", "cta", "footer"],
    ["header", "hero", "quote", "features", "cards", "about", "contact", "footer"],
  ],
  Bookstore: [
    ["announce", "header", "hero", "cards", "features", "stats", "testimonials", "cta", "footer"],
    ["announce", "header", "hero", "press", "cards", "about", "faq", "contact", "footer"],
    ["announce", "header", "hero", "features", "cards", "testimonials", "faq", "cta", "footer"],
  ],
  "Blog & Newsletter": [
    ["header", "hero", "cards", "features", "about", "cta", "faq", "footer"],
    ["header", "hero", "features", "cards", "quote", "about", "cta", "footer"],
    ["announce", "header", "hero", "cards", "stats", "about", "contact", "cta", "footer"],
  ],
  "Series Page": [
    ["header", "hero", "cards", "features", "quote", "about", "events", "cta", "footer"],
    ["header", "hero", "stats", "cards", "testimonials", "faq", "cta", "footer"],
    ["announce", "header", "hero", "press", "cards", "features", "about", "contact", "footer"],
  ],
  Publisher: [
    ["announce", "header", "hero", "stats", "cards", "authors", "about", "events", "contact", "footer"],
    ["header", "hero", "press", "cards", "features", "authors", "testimonials", "cta", "footer"],
    ["header", "hero", "authors", "cards", "stats", "faq", "contact", "footer"],
  ],
  "Book Club": [
    ["announce", "header", "hero", "cards", "features", "events", "testimonials", "faq", "cta", "footer"],
    ["header", "hero", "features", "cards", "stats", "events", "about", "cta", "footer"],
    ["header", "hero", "cards", "events", "quote", "faq", "contact", "footer"],
  ],
};

export const buildDoc = (t: TemplateDef): SiteDoc => {
  const ctx = ctxFor(t);
  const variants = ORDER[t.category];
  const index = TEMPLATES.filter((x) => x.category === t.category).findIndex((x) => x.id === t.id);
  return {
    theme: { ...t.theme },
    blocks: variants[Math.max(0, index) % variants.length].map((type) => newBlock(type, ctx)),
    social: { ...DEFAULT_SOCIAL },
  };
};

/**
 * Where a nav link or button should scroll to, judged by its label ("About" -> the About section).
 * Returns a block id, or undefined when the page has no matching section.
 */
export function resolveTarget(label: string, blocks: Block[]): string | undefined {
  const l = label.toLowerCase();
  const rules: [RegExp, BlockType[]][] = [
    [/faq|question|help/, ["faq", "contact"]],
    [/event|tour|signing|meeting|schedule/, ["events", "cta"]],
    [/press|media|featured|interview/, ["press", "testimonials", "contact"]],
    [/our authors|authors|writers/, ["authors", "about"]],
    [/review|praise|quote|testimon|rating/, ["testimonials", "quote"]],
    [/about|author|story|meet|bio|how it works/, ["about", "features"]],
    [/contact|submit|manuscript|message|support/, ["contact", "cta"]],
    [/newsletter|subscribe|join|sign|notify|chapter|excerpt|sample|club/, ["cta", "contact"]],
    [/journal|topic|world|inside|feature|why|how/, ["features", "cards"]],
    [/book|shop|buy|cart|order|latest|read|series|start|explore|bestsell|work|store|collection|catalogue|pick|month|arrival|signed/, ["cards", "features", "hero"]],
  ];
  for (const [re, types] of rules) {
    if (!re.test(l)) continue;
    for (const t of types) {
      const hit = blocks.find((b) => b.type === t);
      if (hit) return hit.id;
    }
  }
  return undefined;
}
