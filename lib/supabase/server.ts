import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import {
  getSupabaseUrl,
  getSupabasePublishableKey,
  getSupabaseSecretKey,
} from "@/lib/config/env";

// ── Admin Client (service-role, bypasses RLS) ──────────────────────────────
// Used by the repository layer for all admin operations.
// This client MUST only be used in trusted server-side contexts.
// Never import this in client components.

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseSecretKey = getSupabaseSecretKey();

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Missing Supabase configuration. Set SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY in your environment.",
    );
  }

  if (!adminClient) {
    adminClient = createClient<Database>(supabaseUrl, supabaseSecretKey, {
      auth: {
        // Service-role key bypasses RLS: no session management needed.
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

// ── Server Client (with cookie-based auth sessions) ────────────────────────
// Used for operations that need the user's authentication context.
// Reads the session from cookies, working in Server Components, Server Actions,
// and Route Handlers.

export async function getSupabaseServer() {
  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase configuration. Set SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
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
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
