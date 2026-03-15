// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { extractTenantSlug } from '@/lib/tenant'

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''

  // Contexto super admin — reescreve UI para /super-admin/*
  // Rotas de API (/api/*) NÃO são reescritas — já estão no caminho correto
  if (host.split(':')[0] === 'admin.beautly.com') {
    const pathname = req.nextUrl.pathname
    // Não reescrever rotas de API — elas são acessadas diretamente
    if (!pathname.startsWith('/api/')) {
      const rewriteUrl = new URL(`/super-admin${pathname === '/' ? '' : pathname}`, req.url)
      const res = NextResponse.rewrite(rewriteUrl)
      res.headers.set('x-context', 'super-admin')
      return res
    }
    const res = NextResponse.next()
    res.headers.set('x-context', 'super-admin')
    return res
  }

  const devFallback = process.env.DEV_TENANT_SLUG ?? 'demo'
  const previewFallback = process.env.PREVIEW_TENANT_SLUG ?? 'demo'

  // Determinar fallback correto para o ambiente
  const hostname = host.split(':')[0]
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
  const isPreview = hostname.endsWith('.vercel.app')
  const fallback = isLocal || isPreview
    ? (isPreview ? previewFallback : devFallback)
    : 'demo'

  const slug = extractTenantSlug(host, fallback)

  if (!slug) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  res.headers.set('x-tenant-slug', slug)
  res.headers.set('x-context', 'tenant')
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
