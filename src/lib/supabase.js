import { createClient } from '@supabase/supabase-js'

// Use globalThis to survive Turbopack HMR re-evaluations
const GLOBAL_KEY = '__jcorners_supabase__'

function getSupabase() {
  if (typeof globalThis !== 'undefined' && globalThis[GLOBAL_KEY]) {
    return globalThis[GLOBAL_KEY]
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        storageKey: 'jcorners-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    }
  )

  if (typeof globalThis !== 'undefined') {
    globalThis[GLOBAL_KEY] = client
  }

  return client
}

export const supabase = getSupabase()
