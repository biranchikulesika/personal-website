import { createBrowserClient } from '@supabase/ssr'

export function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        experimental: {
          passkey: true,
        },
      },
    }
  )
}
