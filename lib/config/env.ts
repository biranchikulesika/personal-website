// Environment configuration & Supabase variable resolution.

/**
 * Resolves the Supabase URL.
 * Automatically checks NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL.
 */
export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

/**
 * Resolves the Supabase Public / Anon / Publishable key.
 * Automatically checks NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * SUPABASE_PUBLISHABLE_KEY, and SUPABASE_ANON_KEY.
 */
export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
}

/**
 * Resolves the Supabase Service Role / Secret Key (server-side only, bypasses RLS).
 * Automatically checks SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SECRET_KEY.
 */
export function getSupabaseSecretKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY
  );
}

/**
 * Resolves the Supabase JWT Secret.
 */
export function getSupabaseJwtSecret(): string | undefined {
  return process.env.SUPABASE_JWT_SECRET;
}

/**
 * Resolves the Postgres connection URL.
 * Automatically checks POSTGRES_URL, POSTGRES_PRISMA_URL, and POSTGRES_URL_NON_POOLING.
 */
export function getPostgresUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

/**
 * Resolves the canonical site URL from environment variables or falls back to the default.
 * Automatically checks NEXT_PUBLIC_SITE_URL, SITE_URL, VERCEL_PROJECT_PRODUCTION_URL, and VERCEL_URL.
 */
export function getSiteUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (envUrl) {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    return trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  }

  return "https://biranchikulesika.com";
}

/**
 * Resolves the domain hostname from the canonical SITE_URL.
 */
export function getSiteDomain(): string {
  try {
    const url = new URL(getSiteUrl());
    return url.hostname;
  } catch {
    return "biranchikulesika.com";
  }
}

/**
 * Resolves the Google Tag Manager (GTM) Container ID.
 * Returns the trimmed container ID (stripping any accidental quotes) if configured and non-empty, or undefined.
 */
export function getGtmId(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  if (!raw) return undefined;
  const cleaned = raw.replace(/^["']|["']$/g, "").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

