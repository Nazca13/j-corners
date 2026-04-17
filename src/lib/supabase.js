import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client (browser)
// Server-side auth is handled by middleware.js using createServerClient
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
