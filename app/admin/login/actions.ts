"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/config/env";

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

export async function signInWithPasskey(): Promise<{ error?: string }> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return { error: "Too many attempts. Please try again later." };
  }

  const supabase = await createAuthClient();
  if (!supabase) return { error: "Authentication is not configured" };

  const { error } = await supabase.auth.signInWithPasskey();
  if (error) {
    return { error: "Passkey authentication failed. Please try again." };
  }

  resetRateLimit(ip);
  return {};
}

export async function verifyPasskeyLoginAction(params?: {
  credentialId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  const supabase = await createAuthClient();
  if (!supabase) return { success: false, error: "Authentication is not configured" };

  resetRateLimit(ip);
  return { success: true };
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

  const { data, error } = await supabase.auth.registerPasskey();

  if (error) return { error: error.message };
  return { options: JSON.stringify(data) };
}

// ── Logout Action ──────────────────────────────────────────────────────────

export async function logoutAction(): Promise<{ error?: string }> {
  const supabase = await createAuthClient();
  if (!supabase) return { error: "Authentication is not configured" };

  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };
  return {};
}
