import { createBrowserClient } from '@supabase/ssr';

export function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  return createBrowserClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      auth: {
        experimental: {
          passkey: true,
        },
      },
    }
  );
}

