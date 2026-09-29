import { NextResponse, type NextRequest } from 'next/server'
import { extractSubdomain } from '@/lib/subdomain'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'beautly.cloud'

// Caminho inexistente de propósito: força o 404 padrão do Next.
const BLOCKED_PATH = '/not-found-tenant-route'

// Requisições em <tenant>.beautly.cloud são reescritas internamente para /tenant/<tenant>/...,
// sem mudar a URL visível. Apex e painel passam direto.
export function proxy(request: NextRequest) {
  const subdomain = extractSubdomain(request.headers.get('host'), ROOT_DOMAIN)
  if (!subdomain) {
    // A rota interna só é alcançável via rewrite de um subdomínio de tenant.
    const { pathname } = request.nextUrl
    if (pathname === '/tenant' || pathname.startsWith('/tenant/')) {
      return NextResponse.rewrite(new URL(BLOCKED_PATH, request.url))
    }
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = `/tenant/${subdomain}${url.pathname === '/' ? '' : url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // exclui api, assets do Next e qualquer caminho com extensão (arquivos de public/)
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
