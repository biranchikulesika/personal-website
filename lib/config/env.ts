// Environment configuration for the experimental rebuild branch.
//
// This branch must never silently connect to production services.
// If any variable is misconfigured toward a production environment,
// fail loudly instead of falling back.

const DISALLOWED_SOURCES = new Set(['postgres', 'production']);

export function getDataSource(): string {
  const source = process.env.DATA_SOURCE ?? 'mock';
  if (DISALLOWED_SOURCES.has(source)) {
    throw new Error(
      `DATA_SOURCE="${source}" is not allowed. Use "mock" or "supabase".`
    );
  }
  return source;
}

// Authentication is controlled by the AUTH_ENABLED environment variable.
// In development with mock database, auth defaults to disabled.
// In production with Supabase, set AUTH_ENABLED=true to enable admin protection.
export function isAuthEnabled(): boolean {
  return process.env.AUTH_ENABLED === 'true';
}