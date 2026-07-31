'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { LRUCache } from 'lru-cache';

// Professional In-Memory Rate Limiter
// Max 5 attempts per 5 minutes per IP
const rateLimitCache = new LRUCache<string, number>({
  max: 5000,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function authenticateUser(email: string, password: string) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 
             headersList.get('x-real-ip') || 
             'unknown-ip';

  const currentAttempts = rateLimitCache.get(ip) || 0;

  // Brute force detected!
  if (currentAttempts >= 5) {
    // "False Hope": Instantly return a generic error.
    // This perfectly mimics a failed Supabase login without ever calling the database.
    return { error: { message: 'Invalid login credentials' } };
  }

  // Increment attempts
  rateLimitCache.set(ip, currentAttempts + 1);

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Return standard error message so attackers can't distinguish a ban from a bad password
    return { error: { message: 'Invalid login credentials' } };
  }

  // If successful, reset their attempts
  rateLimitCache.delete(ip);
  return { error: null };
}
