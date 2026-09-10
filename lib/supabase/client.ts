import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';
import { getSupabaseUrl, getSupabasePublishableKey } from '@/lib/config/env';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowser() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        experimental: { passkey: true },
      },
    });
  }

  return browserClient;
}
