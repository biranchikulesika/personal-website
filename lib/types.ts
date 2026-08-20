// Provisional domain types.
// Deliberately minimal — the product is still being defined.
// Do not treat these as final. They exist only to prove the
// service-layer architecture works end to end.

// Navigation -----------------------------------------------------------------

export interface NavLink {
  label: string;
  href: string;
}

// Identity -------------------------------------------------------------------

export interface Identity {
  name: string;
  initials: string;
}

// Hero -----------------------------------------------------------------------

export interface NewsletterConfig {
  note: string;
  placeholder: string;
  button: string;
}

export interface HeroImage {
  src: string;
  alt: string;
}

export interface HeroContent {
  greeting: string;
  name: string;
  headline: string;
  supporting: string;
  points: string[];
  newsletter: NewsletterConfig;
  image: HeroImage;
}

// Footer ---------------------------------------------------------------------

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterContent {
  bio: {
    intro: string;
    paragraphs: string[];
  };
  columns: FooterColumn[];
  bottom: string;
}

// Site-level content ---------------------------------------------------------

export interface SiteContent {
  identity: Identity;
  nav: {
    links: NavLink[];
  };
  hero: HeroContent;
  footer: FooterContent;
}

// Homepage sections ----------------------------------------------------------

export type Persona = "builder" | "operator" | "thinker" | "wanderer";

export interface WritingItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  date: string;
  persona: Persona;
  tags: string[];
  coverImage?: string;
  status?: "published" | "unpublished";
}

export interface NoteItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string[];
  date: string;
  persona: Persona;
  tags: string[];
  coverImage?: string;
  status?: "published" | "unpublished";
}

export interface BookItem {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  date: string;
  persona: Persona;
  tags: string[];
  cover?: string;
  link?: string;
}

export interface SectionGroup<T> {
  title: string;
  href: string;
  subheader: string;
  items: T[];
}

export interface HomeContent {
  writing: SectionGroup<WritingItem>;
  notes: SectionGroup<NoteItem>;
  library: SectionGroup<BookItem>;
}

// Scribble (aggregated index) -------------------------------------------------

export type ScribbleEntryType = "essay" | "note" | "book";

export interface ScribbleEntry {
  id: string;
  type: ScribbleEntryType;
  title: string;
  description: string;
  date: string;
  persona: Persona;
  topics: string[];
  href: string;
  author?: string;
}

// Blog posts -----------------------------------------------------------------

export interface PostFigure {
  src: string;
  alt: string;
  caption: string;
}

export interface PostQuote {
  text: string;
  attribution?: string;
}

export interface PostSection {
  id: string;
  heading: string;
  paragraphs: string[];
  figure?: PostFigure;
  quote?: PostQuote;
  footnotes?: string[];
}

export interface BookCard {
  title: string;
  author: string;
  note: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  persona?: Persona;
  tags: string[];
  publishedAt: string;
  lastEditedAt: string;
  assumedAudience: string;
  intro: string[];
  sections: PostSection[];
  books: BookCard[];
  coverImage?: string;
  status?: "published" | "unpublished";
}

// Now page timeline ----------------------------------------------------------

export interface NowBook {
  title: string;
  author: string;
  description: string;
  year?: string;
  cover?: string;
  link?: string;
}

export interface NowEntry {
  id: string;
  title: string;
  date: string;
  content: string;
}

// Media Resources -------------------------------------------------------------

export interface MediaItem {
  id: string;
  name: string;
  src: string;
  alt: string;
  size: string;
  dimensions?: string;
  uploadedAt: string;
  tag: "profile" | "atmosphere" | "post" | "book";
}

// Admin & Security ------------------------------------------------------------

export interface AdminProfile {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  authStatus: "developer_mode" | "enabled";
  lastLogin: string;
}
