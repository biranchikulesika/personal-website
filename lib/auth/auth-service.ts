import type { AppRole } from "@/lib/types";

export interface AuthUserIdentity {
  id: string;
  provider: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  identities?: AuthUserIdentity[];
}

/**
 * Authentication and authorization contract.
 * Isolates application services and server actions from provider-specific auth implementations.
 */
export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  requireUser(): Promise<AuthUser>;
  requireAdmin(): Promise<{ user: AuthUser; role: AppRole }>;
  getUserRole(userId: string): Promise<AppRole | null>;
  signOut(scope?: "local" | "global"): Promise<void>;
  linkIdentity(
    provider: "google" | "github",
    redirectTo?: string
  ): Promise<{ url?: string; error?: string }>;
  unlinkIdentity(targetIdentity: AuthUserIdentity): Promise<{ error?: string }>;
}
