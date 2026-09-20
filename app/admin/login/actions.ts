"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/config/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ContentService } from "@/lib/services/content.service";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server";
import {
  getWebAuthnExpectedOrigin,
  getWebAuthnRpID,
  setPasskeyChallengeCookie,
  consumePasskeyChallengeCookie,
} from "@/lib/auth/webauthn";
import type { PasskeyItem } from "@/lib/types";

const contentService = new ContentService();

// ── Rate Limiting ──────────────────────────────────────────────────────────
// In-memory rate limiter: max 5 attempts per 5 minutes per IP.
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

async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    return (
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
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
            // Server Action: safe to ignore outside request context.
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

// ── WebAuthn / Passkey Authentication Actions ──────────────────────────────

/**
 * Generates WebAuthn authentication options for the client.
 * Binds a cryptographically secure challenge to an HTTP-only cookie.
 */
export async function generatePasskeyAuthenticationOptionsAction(): Promise<{
  success: boolean;
  options?: PublicKeyCredentialRequestOptionsJSON;
  error?: string;
}> {
  const ip = await getClientIp();
  if (!checkRateLimit(ip)) {
    return {
      success: false,
      error: "Too many attempts. Please try again later.",
    };
  }

  try {
    let hostname: string | undefined;
    try {
      const headerList = await headers();
      hostname = headerList.get("host") || undefined;
    } catch {
      // Handled safely
    }

    const rpID = getWebAuthnRpID(hostname);
    const adminPasskeys = await contentService.getAllAdminPasskeys();

    // Prepare list of allowed credentials if available (supports discoverable & non-discoverable passkeys)
    const allowCredentials = adminPasskeys
      .filter((p) => Boolean(p.credentialId || p.id))
      .map((p) => ({
        id: p.credentialId || p.id,
        transports: p.transports as any,
      }));

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    });

    await setPasskeyChallengeCookie({
      challenge: options.challenge,
      action: "authentication",
    });

    return {
      success: true,
      options,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || "Failed to generate passkey authentication options",
    };
  }
}

/**
 * Verifies a WebAuthn authentication assertion from the client.
 * Requires genuine cryptographic signature verification against the stored public key.
 * Only after cryptographic verification succeeds does it establish an authenticated Supabase session.
 */
export async function verifyPasskeyLoginAction(params?: {
  response?: AuthenticationResponseJSON;
  credentialId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const ip = await getClientIp();
  if (!checkRateLimit(ip)) {
    return {
      success: false,
      error: "Too many attempts. Please try again later.",
    };
  }

  // 1. Consume and invalidate the challenge cookie (prevents replay attacks)
  const expectedChallenge = await consumePasskeyChallengeCookie("authentication");
  if (!expectedChallenge) {
    return {
      success: false,
      error: "Authentication session expired or invalid. Please try again.",
    };
  }

  if (!params?.response || !params.response.id) {
    return {
      success: false,
      error: "Missing or invalid WebAuthn response.",
    };
  }

  try {
    let hostname: string | undefined;
    let origin: string | undefined;
    try {
      const headerList = await headers();
      hostname = headerList.get("host") || undefined;
      origin = headerList.get("origin") || undefined;
    } catch {
      // Handled safely
    }

    const expectedRPID = getWebAuthnRpID(hostname);
    const expectedOrigin = getWebAuthnExpectedOrigin(origin);

    // 2. Look up the registered credential by credential ID
    const credRecord = await contentService.findPasskeyCredential(params.response.id);
    if (!credRecord || !credRecord.passkey) {
      return {
        success: false,
        error: "Unrecognized passkey credential. Please sign in with Google or GitHub and re-register your passkey.",
      };
    }

    // If credential exists from legacy registration without public key, require re-registration
    if (!credRecord.passkey.publicKey) {
      return {
        success: false,
        error: "This passkey was registered under a legacy format and must be re-registered. Please sign in with Google or GitHub to re-add it.",
      };
    }

    // 3. Cryptographically verify the WebAuthn assertion signature
    const verification = await verifyAuthenticationResponse({
      response: params.response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        id: credRecord.passkey.credentialId || credRecord.passkey.id,
        publicKey: Buffer.from(credRecord.passkey.publicKey, "base64url"),
        counter: credRecord.passkey.counter || 0,
        transports: credRecord.passkey.transports as any,
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return {
        success: false,
        error: "WebAuthn assertion verification failed.",
      };
    }

    // 4. Update the stored counter & last used date
    const updatedPasskey: PasskeyItem = {
      ...credRecord.passkey,
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    await contentService.savePasskey(credRecord.userId, updatedPasskey);

    // 5. Verify that the user still has an active administrative role in the trusted role store
    const role = await contentService.getUserRole(credRecord.userId);
    if (role !== "super_admin" && role !== "content_admin") {
      return {
        success: false,
        error: "Forbidden: Account does not possess administrative privileges.",
      };
    }

    // 6. Establish the authenticated session in Supabase SSR
    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return {
        success: false,
        error: "Database authentication is not configured.",
      };
    }

    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: credRecord.userEmail,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      return {
        success: false,
        error: linkError?.message || "Failed to establish authenticated session.",
      };
    }

    const supabase = await createAuthClient();
    if (!supabase) {
      return {
        success: false,
        error: "Authentication client is not available.",
      };
    }

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
        return {
          success: false,
          error: magicError.message,
        };
      }
    }

    resetRateLimit(ip);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || "Passkey authentication failed.",
    };
  }
}

export async function signInWithPasskey(): Promise<{ error?: string }> {
  return {
    error: "Please use the passkey button on the login screen to perform biometric or security key authentication.",
  };
}

export async function startPasskeyRegistration(): Promise<{
  options?: string;
  error?: string;
}> {
  return {
    error: "Passkey registration must be performed from the Account Settings panel while logged in.",
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
