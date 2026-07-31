import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabaseClient = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)
