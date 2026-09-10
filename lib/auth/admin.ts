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