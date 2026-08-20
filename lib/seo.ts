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
function ogImage(params: { title?: string; description?: string; type?: string } = {}) {
  const searchParams = new URLSearchParams();
  if (params.title) searchParams.set('title', params.title);
  if (params.description) searchParams.set('description', params.description);
  if (params.type) searchParams.set('type', params.type);
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
  const ogUrl = ogImage({ title, description, type: 'post' });

  return {
    title,
    description,
    alternates: { canonical: url },
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
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630, alt: title }]
        : [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@BKulesika',
      title,
      description,
      images: post.coverImage ? [post.coverImage] : [ogUrl],
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
  const ogUrl = ogImage({ title, description, type: 'note' });

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: SITE_NAME,
      authors: [SITE_NAME],
      tags: [...note.tags, personaLabel],
      images: note.coverImage
        ? [{ url: note.coverImage, width: 1200, height: 630, alt: title }]
        : [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@BKulesika',
      title,
      description,
      images: note.coverImage ? [note.coverImage] : [ogUrl],
    },
  };
}

// ── Structured data (JSON-LD) ───────────────────────────────────────────────

/**
 * JSON-LD for the website (Person + WebSite).
 * Place in the root layout.
 */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    author: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

/**
 * JSON-LD for a blog post article.
 */
export function articleJsonLd(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
    datePublished: post.publishedAt,
    dateModified: post.lastEditedAt,
    url: `${SITE_URL}/p/${post.slug}`,
    image: post.coverImage || ogImage({ title: post.title, type: 'post' }),
    keywords: post.tags.join(', '),
    inLanguage: 'en',
  };
}
