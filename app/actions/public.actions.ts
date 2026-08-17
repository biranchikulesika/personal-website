'use server';

import { headers } from 'next/headers';
import { getPostsMeta } from '@/lib/queries';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function searchPublishedPosts(query: string) {
  if (!query) return [];
  return await getPostsMeta(query);
}

const subscribeSchema = z.object({
  email: z.string().email(),
  personas: z.array(z.string()).min(1).max(4),
  source: z.string().optional()
});

// Simple in-memory rate limiter for newsletter subscriptions.
// In production, this should be replaced with Redis or a database-backed
// rate limiter. This is sufficient for preventing basic abuse on a
// personal website with low traffic.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 3; // 3 per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

export async function subscribeNewsletter(email: string, personas: string[], source: string) {
  try {
    // Rate limiting — prevent abuse of the public subscription endpoint
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';
    
    const { allowed, retryAfter } = checkRateLimit(ip);
    if (!allowed) {
      return { success: false, error: `Too many requests. Please try again in ${retryAfter} seconds.` };
    }

    const validData = subscribeSchema.parse({ email, personas, source });
    // SECURITY: Use the server client (respects RLS) instead of the admin
    // client (which bypasses RLS with the service role key).
    // The 'subscribers' and 'subscriptions' tables have RLS policies that
    // allow public INSERT, so this works without auth.
    const client = await getSupabaseServerClient();

    // Upsert subscriber
    const { data: subscriber, error: subError } = await client
      .from('subscribers')
      .upsert({ email: validData.email }, { onConflict: 'email' })
      .select('id')
      .single();

    if (subError || !subscriber) {
      console.error('Failed to subscribe:', subError);
      // Return generic error — don't leak subscription state
      return { success: false, error: 'Unable to subscribe at this time.' };
    }

    // Insert subscriptions
    const subscriptionsToInsert = validData.personas.map(p => ({
      subscriberId: subscriber.id,
      persona: p,
      active: true
    }));

    // Insert ignoring conflicts on unique constraint (subscriberId, persona)
    const { error: insertError } = await client
      .from('subscriptions')
      .upsert(subscriptionsToInsert, { onConflict: 'subscriberId,persona' });

    if (insertError) {
      console.error('Failed to insert subscriptions:', insertError);
      return { success: false, error: 'Unable to subscribe at this time.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Subscription error:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function getPublicDonations() {
  // SECURITY: Use the server client (respects RLS) instead of the admin
  // client. The 'donations' table has a public read policy that only
  // exposes rows with status='success'. Using the admin client would
  // bypass this restriction and expose ALL donation records including
  // donor email, phone numbers, and pending/failed transactions.
  const client = await getSupabaseServerClient();
  const { data, error } = await client
    .from('donations')
    .select('id, amount, publicName, createdAt, status')
    .eq('status', 'success')
    .order('createdAt', { ascending: false });
    
  if (error) {
    console.error('Error fetching public donations:', error);
    return [];
  }
  
  // Map publicName, falling back to 'Contributor' if null
  return data.map(d => ({
    ...d,
    donorName: d.publicName || 'Contributor'
  }));
}
