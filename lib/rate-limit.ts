// Shared Postgres-backed rate limiter (free Supabase tier; no Redis/Upstash).
// The in-memory fallback is only for local/dev use when Supabase is not configured:
// it is per-instance and does NOT coordinate across serverless invocations.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseSecretKey } from "@/lib/config/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const RATE_LIMIT_CACHE_CAP = 5_000;

const counters = new Map<string, { count: number; resetAt: number }>();

type HeadersLike = Pick<Headers, "get">;

/** Builds a scoped key from platform-set client IP headers only. */
export function rateLimitKey(source: Request | HeadersLike, scope: string): string {
  const headers: HeadersLike = "headers" in source ? source.headers : source;
  const ip =
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return `${scope}:${ip}`;
}

/** Bounded, per-instance fallback. Exported for tests and local dev only. */
export function checkInMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  now: number = Date.now(),
): boolean {
  for (const [entryKey, entry] of counters) {
    if (now >= entry.resetAt) counters.delete(entryKey);
  }

  const entry = counters.get(key);
  if (!entry || now >= entry.resetAt) {
    if (counters.size >= RATE_LIMIT_CACHE_CAP) {
      const oldest = counters.keys().next().value;
      if (oldest) counters.delete(oldest);
    }
    counters.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function rateLimitCacheSize(): number {
  return counters.size;
}

export function clearRateLimitCache(): void {
  counters.clear();
}

/**
 * Atomically increments the shared counter. Returns true when allowed.
 * Denies on store failure unless `failOpen` is set for low-stakes reads.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  options: { failOpen?: boolean } = {},
): Promise<boolean> {
  if (!getSupabaseUrl() || !getSupabaseSecretKey()) {
    return options.failOpen === true
      ? true
      : checkInMemoryRateLimit(key, limit, windowSeconds);
  }

  try {
    // Cast: the generated Database type predates this RPC.
    const admin = getSupabaseAdmin() as unknown as SupabaseClient;
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  } catch {
    return options.failOpen === true;
  }
}
