// Environment configuration for the experimental rebuild branch.
//
// This branch must never silently connect to production services.
// If any variable is misconfigured toward a production environment,
// fail loudly instead of falling back.

const PRODUCTION_SOURCES = new Set(['supabase', 'postgres', 'production']);

export function getDataSource(): string {
  const source = process.env.DATA_SOURCE ?? 'mock';
  if (PRODUCTION_SOURCES.has(source)) {
    throw new Error(
      `DATA_SOURCE="${source}" is not allowed on the experimental rebuild branch. Only "mock" is available.`
    );
  }
  return source;
}

// Authentication is intentionally disabled on this branch.
// The UI and product structure are being developed without a login flow.
export function isAuthEnabled(): boolean {
  return false;
}

export function requireAuthDisabled(): void {
  if (process.env.AUTH_ENABLED === 'true') {
    throw new Error(
      'AUTH_ENABLED is not supported on the experimental rebuild branch. Authentication is disabled by design.'
    );
  }
}