/**
 * Centralised error sanitization and formatting.
 *
 * Ensures technical details (SQL queries, Drizzle/Postgres internals, stack traces)
 * are NEVER exposed to website visitors or admin editors, while logging original
 * errors securely on the server or in development for debugging.
 */

export function sanitizeErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again."
): string {
  if (!error) return fallbackMessage;

  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : String(error);

  // If in development or on server, log for diagnostic purposes
  if (process.env.NODE_ENV === "development" || typeof window === "undefined") {
    console.error("[System Error Log]:", error);
  }

  // Detect technical internals that must NEVER be leaked to clients
  const isTechnical =
    /\b(select|insert|update|delete)\b.*\b(from|into|table|where)\b/i.test(raw) ||
    /\b(relation|column|schema|syntax error)\b/i.test(raw) ||
    /\b(postgres|pg_|drizzle|supabase|prisma|econnrefused)\b/i.test(raw) ||
    /violates (foreign key|unique|not-null)|duplicate key/i.test(raw) ||
    /\b(jwt|token|unauthorized|forbidden)\b/i.test(raw) ||
    /\bat [a-zA-Z0-9_$./]+\s*\(/i.test(raw) ||
    /\b(TypeError|ReferenceError|SyntaxError|RangeError):/i.test(raw);

  if (isTechnical) {
    if (/unique|duplicate/i.test(raw)) {
      return "An item with this title or identifier already exists. Please choose a different one.";
    }
    if (/foreign key|not-null/i.test(raw)) {
      return "Operation failed because required related records are missing.";
    }
    if (/permission|unauthorized|jwt|forbidden/i.test(raw)) {
      return "Unauthorized: You do not have permission to perform this action. Please sign in again.";
    }
    if (/network|fetch|econnrefused/i.test(raw)) {
      return "Network connection issue. Please check your internet connection and try again.";
    }
    return fallbackMessage;
  }

  // Clean, human-readable user message
  const cleaned = raw.trim();
  return cleaned.length > 0 ? cleaned : fallbackMessage;
}
