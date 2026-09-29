import { NextResponse, type NextRequest } from 'next/server'
import { refreshSession } from '@/lib/supabase/session'
import { extractSubdomain, isPanelHost } from '@/lib/subdomain'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'beautly.cloud'

// Caminho inexistente de propósito: força o 404 padrão do Next.
const BLOCKED_PATH = '/not-found-tenant-route'

// - <tenant>.beautly.cloud é reescrito internamente para /tenant/<tenant>/..., sem mudar a URL visível.
// - painel.beautly.cloud e o apex passam direto (com refresh da sessão de auth); a raiz do painel
//   vai para a lista de agendamentos. A autorização de verdade fica no DAL (lib/auth/dal.ts), não aqui.
export async function proxy(request: NextRequest) {
  const host = request.headers.get('host')
  const subdomain = extractSubdomain(host, ROOT_DOMAIN)
  const { pathname } = request.nextUrl

  if (subdomain) {
    const url = request.nextUrl.clone()
    url.pathname = `/tenant/${subdomain}${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  // A rota interna só é alcançável via rewrite de um subdomínio de tenant.
  if (pathname === '/tenant' || pathname.startsWith('/tenant/')) {
    return NextResponse.rewrite(new URL(BLOCKED_PATH, request.url))
  }

  if (isPanelHost(host, ROOT_DOMAIN) && pathname === '/') {
    return NextResponse.redirect(new URL('/agendamentos', request.url))
  }

  return refreshSession(request)
}

export const config = {
  // exclui api, assets do Next e qualquer caminho com extensão (arquivos de public/)
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
