import type { Metadata } from 'next';
import type { BlogPost, NoteItem } from '@/lib/types';
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  PERSONA_LABELS,
} from '@/lib/constants';

/**
 * Generate a dynamic OG image URL.
 * Falls back to a static endpoint that generates the image on the fly.
 */
function ogImage(params: { title?: string; description?: string; type?: string; persona?: string; cover?: string } = {}) {
  const searchParams = new URLSearchParams();
  if (params.title) searchParams.set('title', params.title);
  if (params.description) searchParams.set('description', params.description);
  if (params.type) searchParams.set('type', params.type);
  if (params.persona) searchParams.set('persona', params.persona);
  if (params.cover) searchParams.set('cover', params.cover);
  const qs = searchParams.toString();
  return `${SITE_URL}/api/og${qs ? `?${qs}` : ''}`;
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
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    images: [
      {
        url: ogImage({ title: SITE_NAME, type: 'home' }),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@BKulesika',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [ogImage({ title: SITE_NAME, type: 'home' })],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// ── Page metadata builders ──────────────────────────────────────────────────

/**
 * Generate metadata for a blog post page.
 */
export function postMetadata(post: BlogPost): Metadata {
  const url = `${SITE_URL}/p/${post.slug}`;
  const title = post.title;
  const description = post.description || post.subtitle || '';
  const personaLabel = post.persona
    ? PERSONA_LABELS[post.persona]
    : undefined;
  // Use the dynamic OG route that resolves post data and generates a composed image
  const ogUrl = `${SITE_URL}/api/og?slug=${encodeURIComponent(post.slug)}`;

  const isDraft = post.status === 'unpublished';

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isDraft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
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
      card: 'summary_large_image',
      creator: '@BKulesika',
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
  const description = note.description || '';
  const personaLabel = PERSONA_LABELS[note.persona];
  const noteOgParams: { title: string; description: string; type: string; persona?: string; cover?: string } = {
    title,
    description,
    type: 'note',
  };
  if (personaLabel) noteOgParams.persona = personaLabel;
  if (note.coverImage) noteOgParams.cover = note.coverImage;
  const noteOgUrl = ogImage(noteOgParams);

  const isDraft = note.status === 'unpublished';

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isDraft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: SITE_NAME,
      authors: [SITE_NAME],
      tags: [...note.tags, personaLabel],
      images: [{ url: noteOgUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@BKulesika',
      title,
      description,
      images: [noteOgUrl],
    },
  };
}

// ── Structured data (JSON-LD) ───────────────────────────────────────────────

/**
 * JSON-LD for the website (Person + WebSite with social knowledge graph).
 * Place in the root layout.
 */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en-US',
    author: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
      jobTitle: 'Software Developer & Writer',
      sameAs: [
        'https://github.com/biranchikulesika',
        'https://x.com/BKulesika',
        'https://www.linkedin.com/in/biranchikulesika',
      ],
      knowsAbout: [
        'Software Engineering',
        'Web Architecture',
        'Cybersecurity',
        'Computer Science',
        'Philosophy',
      ],
    },
  };
}

/**
 * JSON-LD for breadcrumbs hierarchy.
 */
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * JSON-LD for a blog post article.
 */
export function articleJsonLd(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/p/${post.slug}`,
    },
    headline: post.title,
    description: post.description || post.subtitle || '',
    author: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
    datePublished: post.publishedAt,
    dateModified: post.lastEditedAt || post.publishedAt,
    url: `${SITE_URL}/p/${post.slug}`,
    image: post.coverImage || ogImage({ title: post.title, type: 'post' }),
    keywords: post.tags.join(', '),
    inLanguage: 'en-US',
  };
}

/**
 * JSON-LD for an atomic note.
 */
export function noteJsonLd(note: NoteItem) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/n/${note.slug}`,
    },
    headline: note.title,
    description: note.description || '',
    author: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
    datePublished: note.date,
    dateModified: note.date,
    url: `${SITE_URL}/n/${note.slug}`,
    image: note.coverImage || ogImage({ title: note.title, type: 'note' }),
    keywords: note.tags.join(', '),
    inLanguage: 'en-US',
  };
}

/**
 * Safely serializes structured data into a JSON-LD string.
 * Escapes `<` to `\u003c` to prevent </script> injection XSS attacks.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
