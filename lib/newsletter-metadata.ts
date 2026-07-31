import { Metadata } from 'next';
import { AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

const NEWSLETTER_META_CONFIG: Record<string, { title: string; description: string; ogImage: string }> = {
  builder: {
    title: 'Forge Dispatch',
    description: 'Updates from the Builder corner — code, systems, and building things.',
    ogImage: '/images/og-fallback-builder.png',
  },
  operator: {
    title: 'Signal Reports',
    description: 'Notes on infrastructure, cybersecurity, and technical thinking.',
    ogImage: '/images/og-fallback-operator.png',
  },
  thinker: {
    title: 'Inside the Head',
    description: 'Periodic letters on philosophy, systems, and reflection.',
    ogImage: '/images/og-fallback-thinker.png',
  },
  wanderer: {
    title: 'Scribble',
    description: 'Notes on places, memories, and things observed along the way.',
    ogImage: '/images/og-fallback-wanderer.png',
  },
};

export function getNewsletterMetadata(persona: string): Metadata {
  const config = NEWSLETTER_META_CONFIG[persona];
  if (!config) {
    return { title: 'Newsletter' };
  }

  const canonicalUrl = getCanonicalUrl(`/${persona}/newsletter`, persona);
  const titleTag = `${config.title} | ${config.title}`;

  return {
    title: titleTag,
    description: config.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: canonicalUrl,
      },
    },
    openGraph: {
      title: titleTag,
      description: config.description,
      url: canonicalUrl,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: config.ogImage,
          width: 1200,
          height: 630,
          alt: titleTag,
        },
      ],
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
