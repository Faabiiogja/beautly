import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client server-side autenticado pelos cookies da sessão da profissional; RLS se aplica.
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Chamado de um Server Component (cookies read-only): o refresh de sessão será feito no proxy (fatia de login).
          }
        },
      },
    },
  )
}
