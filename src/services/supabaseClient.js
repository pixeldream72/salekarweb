import { createClient } from '@supabase/supabase-js';

export function getSupabaseConfig(env = import.meta.env) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || '';
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';

  return { url, anonKey };
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file (or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY if you prefer the Vite naming convention).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
