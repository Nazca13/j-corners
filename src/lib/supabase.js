import { createClient } from '@supabase/supabase-js'

// Singleton pattern — prevents multiple GoTrueClient instances
let _supabase = null

function getSupabase() {
  if (_supabase) return _supabase

  _supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        storageKey: 'jcorners-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
  return _supabase
}

export const supabase = getSupabase()
