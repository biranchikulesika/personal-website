import { SOCIAL_LINKS } from './socials';

/**
 * Central SEO configuration.
 * Single source of truth for site URL, author identity, and persona metadata.
 */

export const SITE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_ROOT_DOMAIN
      ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
      : 'https://biranchikulesika.com';

export const SITE_NAME = 'Biranchi Kulesika';

export const AUTHOR = {
  name: 'Biranchi Kulesika',
  url: 'https://biranchikulesika.com',
  twitter: '@BKulesika',
  sameAs: [
    SOCIAL_LINKS.github,
    SOCIAL_LINKS.linkedin,
    SOCIAL_LINKS.twitter,
    SOCIAL_LINKS.instagram,
  ],
} as const;

export const PERSONA_META = {
  builder: {
    title: 'Builder',
    description: 'Building things with code, systems, and open source.',
    ogImage: '/images/og-fallback-builder.png',
  },
  thinker: {
    title: 'Inside The Head',
    description: 'Thoughts, reflections, and things I am trying to understand.',
    ogImage: '/images/og-fallback-thinker.png',
  },
  wanderer: {
    title: 'Wanderer',
    description: 'Stories, places, memories, and things noticed along the way.',
    ogImage: '/images/og-fallback-wanderer.png',
  },
  operator: {
    title: 'Operator',
    description: 'Infrastructure, systems, and understanding what lies beneath the surface.',
    ogImage: '/images/og-fallback-operator.png',
  },
  main: {
    title: 'Biranchi Kulesika',
    description: 'Personal website of Biranchi Kulesika. Writing about technology, cybersecurity, philosophy, and life.',
    ogImage: '/images/og-main.png',
  },
} as const;

export type PersonaKey = keyof typeof PERSONA_META;

/** Returns an absolute canonical URL for the given path.
 *  When `persona` is provided and subdomains are active in production,
 *  returns a subdomain URL (e.g. `https://thinker.biranchikulesika.com/about`)
 *  instead of a path-based main-domain URL. */
export function getCanonicalUrl(path: string = '', persona?: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const useSubdomains = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === 'true';
  const baseDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'biranchikulesika.com';
  if (useSubdomains && process.env.NODE_ENV !== 'development' && persona) {
    const subdomainPath = cleanPath.replace(new RegExp(`^/${persona}`), '') || '/';
    return `https://${persona}.${baseDomain}${subdomainPath}`;
  }
  return `${SITE_URL}${cleanPath}`;
}

/** Returns the absolute OG image URL for a persona. */
export function getPersonaOgImage(persona: PersonaKey): string {
  return `${SITE_URL}${PERSONA_META[persona].ogImage}`;
}

/** Returns the best OG image URL for a post, falling back to persona image. */
export function getPostOgImage(post: { coverImageUrl?: string; persona?: string }): string {
  if (post.coverImageUrl) {
    // If it's already an absolute URL (e.g. from Supabase storage), use it directly
    if (post.coverImageUrl.startsWith('http')) return post.coverImageUrl;
    return `${SITE_URL}${post.coverImageUrl}`;
  }
  const persona = (post.persona as PersonaKey) || 'main';
  return getPersonaOgImage(persona in PERSONA_META ? persona : 'main');
}

/**
 * Returns the URL for a dynamically generated OG image via the /api/og edge function.
 * Used when no cover image is set — generates a beautiful branded image with the post title.
 * Only applies in production; uses static fallback in development.
 */
export function getDynamicPostOgUrl(title: string, excerpt?: string, persona?: string): string {
  const params = new URLSearchParams();
  params.set('title', title);
  if (excerpt) params.set('excerpt', excerpt);
  if (persona) params.set('persona', persona);
  return `${SITE_URL}/api/og?${params.toString()}`;
}
