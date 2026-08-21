// Environment configuration.
//
// Only "mock" and "supabase" are supported data sources.
// Any other value causes a loud failure instead of a silent fallback.

const ALLOWED_SOURCES = new Set(['mock', 'supabase']);

export function getDataSource(): string {
  const source = process.env.DATA_SOURCE ?? 'mock';
  if (!ALLOWED_SOURCES.has(source)) {
    throw new Error(
      `DATA_SOURCE="${source}" is not allowed. Use "mock" or "supabase".`
    );
  }
  return source;
}
