import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Renova a sessão do Supabase Auth (cookies) a cada requisição, no proxy, e devolve a resposta
// a ser usada. Os cookies renovados vão na requisição (para Server Components da mesma
// requisição enxergarem os tokens novos) e na resposta (para o browser).
// Só chama o Supabase se já existir cookie de sessão: visitantes anônimos não custam nada.
export async function refreshSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })
  const hasSession = request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'))
  if (!hasSession) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet, headers) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    },
  )
  await supabase.auth.getUser()
  return response
}
