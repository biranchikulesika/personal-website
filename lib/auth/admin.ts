/**
 * Admin role helpers. The single source of truth for what counts as an
 * "admin" across the auth guard (proxy.ts), server components, and actions.
 * Only users holding `content_admin` or `super_admin` in public.user_roles
 * may ever access /admin.
 */
export function isAdminRole(
  role: string | null | undefined,
): role is "super_admin" | "content_admin" {
  return role === "super_admin" || role === "content_admin";
}

// ── Admin allowlist ────────────────────────────────────────────────────────
// This is a single-owner publication. Only these addresses may sign in to
// /admin; every alias opens the same admin workspace. Add an address here to
// grant access, remove it to revoke access. Keep this file server-only.

export const PRIMARY_ADMIN_EMAIL = "biranchikulesika@gmail.com";

export const ALLOWED_ADMIN_EMAILS = [
  PRIMARY_ADMIN_EMAIL,
  "biranchi.dev@proton.me",
  "biranchi@kulesika.in",
  "kulesikabiranchi@gmail.com",
] as const;

/** Case-insensitive exact match against the hardcoded allowlist. */
export function isAllowedAdminEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  return (ALLOWED_ADMIN_EMAILS as readonly string[]).includes(
    email.trim().toLowerCase(),
  );
}