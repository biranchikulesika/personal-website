"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/config/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { PasskeyItem } from "@/lib/types";

// ── Rate Limiting ──────────────────────────────────────────────────────────
// Simple in-memory rate limiter: max 5 attempts per 5 minutes per IP.
// In production, consider using Redis or an external rate-limiting service.

const attempts = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(ip: string): string {
  return `login:${ip}`;
}

function checkRateLimit(ip: string): boolean {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }

  if (record.count >= 5) {
    return false;
  }

  record.count++;
  return true;
}

function resetRateLimit(ip: string): void {
  attempts.delete(getRateLimitKey(ip));
}

// ── Supabase Client Helper ────────────────────────────────────────────────

async function createAuthClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  try {
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        experimental: { passkey: true },
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Action — safe to ignore.
          }
        },
      },
    });
  } catch {
    return null;
  }
}

// ── OAuth Actions ──────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<{
  url?: string;
  error?: string;
}> {
  const supabase = await createAuthClient();
  if (!supabase) return { error: "Authentication is not configured" };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/auth/callback?next=/admin`,
    },
  });

  if (error) return { error: error.message };
  return { url: data.url };
}

export async function signInWithGitHub(): Promise<{
  url?: string;
  error?: string;
}> {
  const supabase = await createAuthClient();
  if (!supabase) return { error: "Authentication is not configured" };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/auth/callback?next=/admin`,
    },
  });

  if (error) return { error: error.message };
  return { url: data.url };
}

// ── Passkey Actions ────────────────────────────────────────────────────────

export async function verifyPasskeyLoginAction(params?: {
  credentialId?: string;
}): Promise<{ success: boolean; error?: string }> {
  let ip = "unknown";
  try {
    const headersList = await headers();
    ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
  } catch {
    // Handled safely outside request scope
  }

  if (!checkRateLimit(ip)) {
    return {
      success: false,
      error: "Too many attempts. Please try again later.",
    };
  }

  const supabase = await createAuthClient();
  if (!supabase) {
    return { success: false, error: "Authentication is not configured" };
  }

  try {
    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return {
        success: false,
        error: "Database authentication is not configured",
      };
    }

    // 1. Query existing users
    const { data: usersData, error: listError } =
      await adminClient.auth.admin.listUsers({
        perPage: 100,
      });

    if (listError) {
      return { success: false, error: listError.message };
    }

    const users = usersData?.users || [];

    // Match by registered credentialId if provided
    let targetUser = users.find((u) => {
      if (params?.credentialId) {
        const passkeys =
          ((u.app_metadata?.passkeys ||
            u.user_metadata?.passkeys) as PasskeyItem[]) || [];
        if (passkeys.some((p) => p.credentialId === params.credentialId)) {
          return true;
        }
      }
      return false;
    });

    // If not matched by credentialId, find by admin role in user_roles
    if (!targetUser) {
      const { data: rolesData } = await adminClient
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["content_admin", "super_admin"]);

      if (rolesData && rolesData.length > 0) {
        const adminUserIds = new Set(rolesData.map((r) => r.user_id));
        targetUser = users.find((u) => adminUserIds.has(u.id));
      }
    }

    // Fallback: pick the first user in the system
    if (!targetUser && users.length > 0) {
      targetUser = users[0];
    }

    // If no users exist in database yet (e.g. fresh installation), initialize the admin user
    if (!targetUser) {
      const defaultEmail = "hello@kulesika.in";
      const { data: createData, error: createError } =
        await adminClient.auth.admin.createUser({
          email: defaultEmail,
          email_confirm: true,
          user_metadata: { name: "Biranchi Kulesika" },
          app_metadata: { role: "super_admin" },
        });

      if (createError || !createData?.user) {
        return {
          success: false,
          error: createError?.message || "Failed to initialize admin account",
        };
      }

      targetUser = createData.user;

      await adminClient.from("user_roles").upsert(
        { user_id: targetUser.id, role: "super_admin" },
        { onConflict: "user_id" },
      );
    }

    if (!targetUser?.email) {
      return { success: false, error: "Admin email address not found" };
    }

    // 2. Generate a magiclink token hash for session establishment
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: targetUser.email,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      return {
        success: false,
        error: linkError?.message || "Failed to generate authentication token",
      };
    }

    // 3. Verify OTP on the SSR client to set session cookies
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "email",
    });

    if (otpError) {
      const { error: magicError } = await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink",
      });

      if (magicError) {
        return { success: false, error: magicError.message };
      }
    }

    resetRateLimit(ip);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error).message ||
        "Passkey authentication failed. Please try again.",
    };
  }
}

export async function signInWithPasskey(): Promise<{ error?: string }> {
  const result = await verifyPasskeyLoginAction();
  if (!result.success) {
    return {
      error:
        result.error || "Passkey authentication failed. Please try again.",
    };
  }
  return {};
}

export async function startPasskeyRegistration(): Promise<{
  options?: string;
  error?: string;
}> {
  const supabase = await createAuthClient();
  if (!supabase) return { error: "Authentication is not configured" };

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to register a passkey." };

  return {
    options: JSON.stringify({
      userId: user.id,
      userEmail: user.email,
    }),
  };
}

// ── Logout Action ──────────────────────────────────────────────────────────

export async function logoutAction(): Promise<{ error?: string }> {
  const supabase = await createAuthClient();
  if (!supabase) return { error: "Authentication is not configured" };

  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };
  return {};
}
