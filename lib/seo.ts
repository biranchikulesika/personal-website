import {
  PERSONA_LABELS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/constants";
import type { BlogPost, NoteItem } from "@/lib/types";
import type { Metadata } from "next";

// Build commit SHA (available on Vercel) — bumps static-page OG URLs on every
// deploy so crawlers/CDNs can't serve a stale cached banner after a release.
const DEPLOY_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

/**
 * Appendix a cache-busting `v` param to an OG image URL. The value changes
 * whenever the rendered image would change (an edit for posts/notes, a deploy
 * for static pages), forcing social scrapers to fetch the latest image. The
 * parameter is ignored by the OG route, so bare old URLs keep resolving.
 */
function versionedOgUrl(base: string, version?: string): string {
  const v = version || DEPLOY_VERSION;
  if (!v) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${encodeURIComponent(v)}`;
}

/**
 * Generate a dynamic OG image URL.
 * Falls back to a static endpoint that generates the image on the fly.
 */
function ogImage(
  params: {
    title?: string;
    description?: string;
    type?: string;
    persona?: string;
    cover?: string;
  } = {},
) {
  const searchParams = new URLSearchParams();
  if (params.title) searchParams.set("title", params.title);
  if (params.description) searchParams.set("description", params.description);
  if (params.type) searchParams.set("type", params.type);
  if (params.persona) searchParams.set("persona", params.persona);
  if (params.cover) searchParams.set("cover", params.cover);
  const qs = searchParams.toString();
  return versionedOgUrl(`${SITE_URL}/api/og${qs ? `?${qs}` : ""}`);
}

// ── Base metadata ───────────────────────────────────────────────────────────

/**
 * Root metadata applied to every page via the root layout.
 * Child pages override specific fields through Next.js metadata inheritance.
 */
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    images: [
      {
        url: ogImage({ title: SITE_NAME, type: "home" }),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@BKulesika",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [ogImage({ title: SITE_NAME, type: "home" })],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

// ── Page metadata builders ──────────────────────────────────────────────────

/**
 * Generate metadata for a blog post page.
 */
export function postMetadata(post: BlogPost): Metadata {
  const url = `${SITE_URL}/p/${post.slug}`;
  const title = post.title;
  const description = post.description || post.subtitle || "";
  const personaLabel = post.persona ? PERSONA_LABELS[post.persona] : undefined;
  // Use the dynamic OG route that resolves post data and generates a composed image
  const ogUrl = versionedOgUrl(`${SITE_URL}/api/og?slug=${encodeURIComponent(post.slug)}`, post.lastEditedAt);

  const isDraft = post.status === "unpublished";

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isDraft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: SITE_NAME,
      publishedTime: post.publishedAt,
      modifiedTime: post.lastEditedAt,
      authors: [SITE_NAME],
      tags: [...post.tags, ...(personaLabel ? [personaLabel] : [])],
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@BKulesika",
      title,
      description,
      images: [ogUrl],
    },
  };
}

/**
 * Generate metadata for a note page.
 */
export function noteMetadata(note: NoteItem): Metadata {
  const url = `${SITE_URL}/n/${note.slug}`;
  const title = note.title;
  const description = note.subtitle || note.description || "";
  const personaLabel = note.persona ? PERSONA_LABELS[note.persona] : undefined;
  const noteOgUrl = versionedOgUrl(`${SITE_URL}/api/og?slug=${encodeURIComponent(note.slug)}&type=note`, note.date);

  const isDraft = note.status === "unpublished";

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isDraft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: SITE_NAME,
      publishedTime: note.date,
      modifiedTime: note.date,
      authors: [SITE_NAME],
      tags: [...note.tags, ...(personaLabel ? [personaLabel] : [])],
      images: [{ url: noteOgUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@BKulesika",
      title,
      description,
      images: [noteOgUrl],
    },
  };
}

/**
 * Generate metadata for the About page.
 */
export function aboutMetadata(): Metadata {
  const url = `${SITE_URL}/about`;
  const title = "About";
  const description =
    "A little about Biranchi Kulesika, his work, writing, interests, and the things he is learning along the way.";
  const ogUrl = versionedOgUrl(`${SITE_URL}/api/og?type=about`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      title: "About | Biranchi Kulesika",
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: "About Biranchi Kulesika",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@BKulesika",
      title: "About | Biranchi Kulesika",
      description,
      images: [ogUrl],
    },
  };
}

/**
 * Generate metadata for the Library page.
 */
export function libraryMetadata(): Metadata {
  const url = `${SITE_URL}/library`;
  const title = "Library";
  const description =
    "Books I've read, loved, and recommend for others to read.";
  const ogUrl = versionedOgUrl(`${SITE_URL}/api/og?type=library`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: "Library | Biranchi Kulesika",
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: "Library" }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@BKulesika",
      title: "Library | Biranchi Kulesika",
      description,
      images: [ogUrl],
    },
  };
}

/**
 * Generate metadata for the Scribble page.
 */
export function scribbleMetadata(): Metadata {
  const url = `${SITE_URL}/scribble`;
  const title = "Scribble";
  const description = "Writing and thinking, shared openly.";
  const ogUrl = versionedOgUrl(`${SITE_URL}/api/og?type=scribble`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: "Scribble | Biranchi Kulesika",
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: "Scribble" }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@BKulesika",
      title: "Scribble | Biranchi Kulesika",
      description,
      images: [ogUrl],
    },
  };
}

/**
 * Generate metadata for the Now page.
 */
export function nowMetadata(): Metadata {
  const url = `${SITE_URL}/now`;
  const title = "Now";
  const description =
    "What I’m reading, exploring, working on, and thinking about these days.";
  const ogUrl = versionedOgUrl(`${SITE_URL}/api/og?type=now`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: "Now | Biranchi Kulesika",
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: "Now" }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@BKulesika",
      title: "Now | Biranchi Kulesika",
      description,
      images: [ogUrl],
    },
  };
}

/**
 * Generate metadata for the Home page.
 */
export function homeMetadata(): Metadata {
  const url = SITE_URL;
  const title = SITE_NAME;
  const description = SITE_DESCRIPTION;
  const ogUrl = versionedOgUrl(`${SITE_URL}/api/og?type=home`);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${title} | Independent Developer & Writer`,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@BKulesika",
      title: `${title} | Independent Developer & Writer`,
      description,
      images: [ogUrl],
    },
  };
}

/**
 * Generate metadata for the Support & Patronage page.
 */
export function supportMetadata(): Metadata {
  const url = `${SITE_URL}/support`;
  const title = "Support & Patronage";
  const description =
    "Support my work and help me keep building, writing, and sharing things openly.";
  const ogUrl = versionedOgUrl(`${SITE_URL}/api/og?type=support`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: "Support & Patronage | Biranchi Kulesika",
      description,
      url,
      siteName: SITE_NAME,
      images: [
        { url: ogUrl, width: 1200, height: 630, alt: "Support & Patronage" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@BKulesika",
      title: "Support & Patronage | Biranchi Kulesika",
      description,
      images: [ogUrl],
    },
  };
}

// ── Structured data (JSON-LD) ───────────────────────────────────────────────

/**
 * Canonical @id for Biranchi Kulesika's Person entity.
 * Pointing at the About page (the identity page) lets crawlers merge the
 * author of every post/note with this single knowledge-graph node.
 */
const PERSON_ID = `${SITE_URL}/about`;

/**
 * The Person entity for Biranchi Kulesika.
 *
 * Defined once and referenced by `@id` from every WebSite / Article / note
 * block so the site never carries a second, divergent copy of its author's
 * identity. Image uses the real portrait rather than a favicon square.
 */
export function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/about`,
    image: `${SITE_URL}/biranchi.webp`,
    jobTitle: "Software Developer & Writer",
    sameAs: [
      "https://github.com/biranchikulesika",
      "https://x.com/BKulesika",
      "https://linkedin.com/in/biranchikulesika",
      "https://instagram.com/biranchikulesika",
    ],
    knowsAbout: [
      "Software Engineering",
      "Web Architecture",
      "Cybersecurity",
      "Computer Science",
      "Philosophy",
    ],
  };
}

/**
 * JSON-LD for the personal identity page (About).
 * A standalone Person block so the web site's single author is exposed as an
 * entity in its own right, with its social knowledge graph.
 */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    ...personNode(),
  };
}

/**
 * JSON-LD for the website (Person + WebSite with social knowledge graph).
 * Place in the root layout.
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en-US",
    image: `${SITE_URL}/favicon/web-app-manifest-512x512.png`,
    author: personNode(),
  };
}

/**
 * JSON-LD for breadcrumbs hierarchy.
 */
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${SITE_URL}${item.url.startsWith("/") ? item.url : `/${item.url}`}`,
    })),
  };
}

/**
 * JSON-LD for a blog post article.
 */
export function articleJsonLd(post: BlogPost) {
  const postImage = post.coverImage
    ? post.coverImage.startsWith("http")
      ? post.coverImage
      : `${SITE_URL}${post.coverImage.startsWith("/") ? post.coverImage : `/${post.coverImage}`}`
    : versionedOgUrl(`${SITE_URL}/api/og?slug=${encodeURIComponent(post.slug)}`, post.lastEditedAt);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/p/${post.slug}`,
    },
    headline: post.title,
    description: post.description || post.subtitle || "",
    author: personNode(),
    publisher: personNode(),
    datePublished: post.publishedAt,
    dateModified: post.lastEditedAt || post.publishedAt,
    url: `${SITE_URL}/p/${post.slug}`,
    image: postImage,
    keywords: post.tags.join(", "),
    inLanguage: "en-US",
  };
}

/**
 * JSON-LD for an atomic note.
 */
export function noteJsonLd(note: NoteItem) {
  const noteImage = note.coverImage
    ? note.coverImage.startsWith("http")
      ? note.coverImage
      : `${SITE_URL}${note.coverImage.startsWith("/") ? note.coverImage : `/${note.coverImage}`}`
    : versionedOgUrl(`${SITE_URL}/api/og?slug=${encodeURIComponent(note.slug)}&type=note`, note.date);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/n/${note.slug}`,
    },
    headline: note.title,
    description: note.subtitle || note.description || "",
    author: personNode(),
    publisher: personNode(),
    datePublished: note.date,
    dateModified: note.date,
    url: `${SITE_URL}/n/${note.slug}`,
    image: noteImage,
    keywords: note.tags.join(", "),
    inLanguage: "en-US",
  };
}

/**
 * Safely serializes structured data into a JSON-LD string.
 * Escapes `<` to `\u003c` to prevent </script> injection XSS attacks.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
