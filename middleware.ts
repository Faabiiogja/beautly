// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { extractTenantSlug, MARKETING_HOSTS } from '@/lib/tenant'

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const hostname = host.split(':')[0]
  const pathname = req.nextUrl.pathname

  // Contexto super admin — beautly.cloud + path /admin/*
  // Rewrite interno: /admin/* → /super-admin/* (middleware, não vercel.json)
  if (hostname === 'beautly.cloud' && pathname.startsWith('/admin')) {
    const superAdminPath = pathname.replace(/^\/admin/, '/super-admin')
    const rewriteUrl = new URL(superAdminPath, req.url)
    const res = NextResponse.rewrite(rewriteUrl)
    res.headers.set('x-context', 'super-admin')
    return res
  }

  // Contexto marketing — qualquer host de marketing (beautly.cloud, www.beautly.cloud)
  // www.beautly.cloud/admin NÃO é super admin — serve marketing normalmente.
  if (MARKETING_HOSTS.has(hostname)) {
    const res = NextResponse.next()
    res.headers.set('x-context', 'marketing')
    return res
  }

  // Contexto tenant — resolve slug antes do supabase para que o setAll
  // já use os request headers corretos quando precisar atualizar cookies.
  const devFallback = process.env.DEV_TENANT_SLUG ?? 'demo'
  const previewFallback = process.env.PREVIEW_TENANT_SLUG ?? 'demo'

  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
  const isPreview = hostname.endsWith('.vercel.app')
  const fallback = isPreview ? previewFallback : isLocal ? devFallback : 'demo'

  const slug = extractTenantSlug(host, fallback)

  // Injeta x-tenant-slug nos request headers para que Server Components
  // possam lê-lo via headers(). Setar apenas no response NÃO funciona.
  const requestHeaders = new Headers(req.headers)
  if (slug) {
    requestHeaders.set('x-tenant-slug', slug)
    requestHeaders.set('x-context', 'tenant')
  }

  // Cria a resposta inicial já com os request headers corretos.
  // O setAll do supabase também recria res com requestHeaders — slug já incluso.
  let res = NextResponse.next({ request: { headers: requestHeaders } })

  // @supabase/ssr requer getUser() no middleware para manter tokens válidos
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          // Usa requestHeaders (já com x-tenant-slug) para não perder o contexto
          res = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Necessário para refresh do JWT — não remover
  await supabase.auth.getUser()

  if (slug) {
    // Também expõe no response header (útil para debugging)
    res.headers.set('x-tenant-slug', slug)
    res.headers.set('x-context', 'tenant')
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
