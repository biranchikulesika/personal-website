import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabaseClient = createBrowserClient<Database>(
  supabaseUrl,
  supabasePublishableKey
);

