import { createClient } from '@supabase/supabase-js'

// Client anon sem cookies: lê apenas o que as policies de `anon` permitem, mesmo que quem visita
// esteja logada como profissional em outro subdomínio. Usado pela página pública.
export function createAnonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
