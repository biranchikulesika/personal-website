import { Metadata } from 'next';
import { AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

/**
 * Shared metadata generators for persona blog pages.
 * Each persona has unique blog titles, descriptions, and OG images.
 * This centralizes the metadata so changes don't need to be made in 4+ places.
 */

interface BlogMetaConfig {
  blog: { title: string; description: string; ogImage: string };
  archive: { title: string; description: string };
}

const PERSONA_LABELS: Record<string, string> = {
  builder: 'Builder',
  operator: 'Operator',
  thinker: 'Inside The Head',
  wanderer: 'Wanderer',
};

const BLOG_META_CONFIG: Record<string, BlogMetaConfig> = {
  builder: {
    blog: {
      title: 'Blogs',
      description: 'Read the latest essays, thoughts, and technical writing from the Builder persona.',
      ogImage: '/images/og-fallback-builder.png',
    },
    archive: {
      title: 'Archive',
      description: 'Explore older build logs and technical essays.',
    },
  },
  operator: {
    blog: {
      title: 'Logs',
      description: 'Tactical logs and operational security notes.',
      ogImage: '/images/og-fallback-operator.png',
    },
    archive: {
      title: 'Archive',
      description: 'Historical operations and archived security logs.',
    },
  },
  thinker: {
    blog: {
      title: 'Essays',
      description: 'Deep dives, philosophies, and analytical essays by Biranchi Kulesika.',
      ogImage: '/images/og-fallback-thinker.png',
    },
    archive: {
      title: 'Archive',
      description: 'Past essays and philosophical records.',
    },
  },
  wanderer: {
    blog: {
      title: 'Field Sketches',
      description: 'Observations and stories from the field.',
      ogImage: '/images/og-fallback-wanderer.png',
    },
    archive: {
      title: 'Logs',
      description: 'Archived field sketches and past journeys.',
    },
  },
};

export function getBlogMetadata(persona: string): Metadata {
  const config = BLOG_META_CONFIG[persona];
  const label = PERSONA_LABELS[persona] || '';
  if (!config) return { title: 'Blogs' };

  const canonicalUrl = getCanonicalUrl(`/${persona}/blogs`, persona);

  return {
    title: config.blog.title,
    description: config.blog.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: canonicalUrl,
      },
    },
    openGraph: {
      title: `${config.blog.title} — ${label}`,
      description: config.blog.description,
      url: canonicalUrl,
      type: 'website',
      locale: 'en_US',
      images: config.blog.ogImage
        ? [
            {
              url: config.blog.ogImage,
              width: 1200,
              height: 630,
              alt: `${config.blog.title} — ${label}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      creator: AUTHOR.twitter,
      site: AUTHOR.twitter,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function getArchiveMetadata(persona: string): Metadata {
  const config = BLOG_META_CONFIG[persona];
  const label = PERSONA_LABELS[persona] || '';
  if (!config) return { title: 'Archive' };

  const canonicalUrl = getCanonicalUrl(`/${persona}/blogs/archive`, persona);

  return {
    title: config.archive.title,
    description: config.archive.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: canonicalUrl,
      },
    },
    openGraph: {
      title: `${config.archive.title} — ${label}`,
      description: config.archive.description,
      url: canonicalUrl,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      creator: AUTHOR.twitter,
      site: AUTHOR.twitter,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
