import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '../database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

export async function getSupabaseServerClient() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // cookies() may throw during build-time operations like generateStaticParams
    // where there is no HTTP request context. In that case we fall back to a
    // cookie-less client — public data queries (published posts, etc.) work fine
    // because RLS policies on public reads don't require authentication.
  }

  if (!cookieStore) {
    return createServerClient<Database>(
      supabaseUrl,
      supabasePublishableKey,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
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
}

// For use ONLY in trusted server-side contexts bypassing RLS
export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing required Supabase server configuration: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY');
  }
  return createClient<Database>(supabaseUrl, supabaseSecretKey);
}

