import { getSupabaseServer } from "@/lib/supabase/server";
import { isAdminRole } from "./admin";
import { getContentRepository } from "@/lib/repositories";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/config/env";
import type { AppRole } from "@/lib/types";
import type { AuthService, AuthUser, AuthUserIdentity } from "./auth-service";

export class SupabaseAuthService implements AuthService {
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const supabase = await getSupabaseServer();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
        identities: user.identities?.map((i) => ({
          id: i.id,
          provider: i.provider,
        })),
      };
    } catch {
      return null;
    }
  }

  async requireUser(): Promise<AuthUser> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized: Active user session required");
    }
    return user;
  }

  async requireAdmin(): Promise<{ user: AuthUser; role: AppRole }> {
    const user = await this.requireUser();
    const repo = getContentRepository();
    const role = await repo.getUserRole(user.id);

    if (!role || !isAdminRole(role)) {
      throw new Error("Forbidden: Administrative privileges required");
    }

    return { user, role };
  }

  async getUserRole(userId: string): Promise<AppRole | null> {
    const repo = getContentRepository();
    return repo.getUserRole(userId);
  }

  async signOut(scope: "local" | "global" = "local"): Promise<void> {
    try {
      const supabase = await getSupabaseServer();
      await supabase.auth.signOut({ scope });
    } catch {
      // Safe to ignore if session already invalidated
    }
  }

  async linkIdentity(
    provider: "google" | "github",
    redirectTo?: string
  ): Promise<{ url?: string; error?: string }> {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabasePublishableKey();
    if (!supabaseUrl || !supabaseKey) {
      return { error: "Auth provider is not configured" };
    }

    try {
      const supabase = await getSupabaseServer();
      const defaultRedirect = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/auth/callback?next=/admin`;
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: redirectTo || defaultRedirect,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { url: data?.url ?? undefined };
    } catch (err: unknown) {
      return { error: (err as Error).message || "Failed to link identity" };
    }
  }

  async unlinkIdentity(targetIdentity: AuthUserIdentity): Promise<{ error?: string }> {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabasePublishableKey();
    if (!supabaseUrl || !supabaseKey) {
      return { error: "Auth provider is not configured" };
    }

    try {
      const supabase = await getSupabaseServer();
      const { error } = await supabase.auth.unlinkIdentity(targetIdentity as any);
      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err: unknown) {
      return { error: (err as Error).message || "Failed to unlink identity" };
    }
  }
}
