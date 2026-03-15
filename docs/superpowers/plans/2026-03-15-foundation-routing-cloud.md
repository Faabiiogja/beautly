# Foundation Routing — beautly.cloud Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o roteamento multi-tenant do Beautly para o domínio `beautly.cloud`, com super admin em `beautly.cloud/admin` (path-based) em vez de subdomínio separado.

**Architecture:** `lib/tenant.ts` atualiza `MARKETING_HOSTS` para `beautly.cloud`/`www.beautly.cloud` e exporta o set para uso no middleware. `middleware.ts` remove o bloco `superAdminHosts` e passa a detectar super admin por host + path (`beautly.cloud` + `/admin`). `vercel.json` substitui o `alias` legado por um rewrite condicional por host.

**Tech Stack:** Next.js 15 App Router, TypeScript, Vitest, Vercel

**Spec:** `docs/superpowers/specs/2026-03-15-foundation-routing-design.md`

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `lib/tenant.ts` | Modificar | Atualizar `MARKETING_HOSTS`, exportar o set, remover caso `admin.beautly.com` |
| `middleware.ts` | Modificar | Remover `superAdminHosts`, adicionar detecção por host + path, importar `MARKETING_HOSTS` |
| `vercel.json` | Substituir | Trocar `alias` por rewrite condicional `beautly.cloud/admin → /super-admin/*` |
| `__tests__/lib/tenant.test.ts` | Modificar | Substituir casos de `beautly.com` por `beautly.cloud`, remover caso `admin.beautly.com` |
| `__tests__/middleware.test.ts` | Modificar | Adicionar casos para `beautly.cloud + /admin`, `www.beautly.cloud + /admin`, `{slug}.beautly.cloud + /admin` |

---

## Chunk 1: lib/tenant.ts

### Task 1: Atualizar testes de `extractTenantSlug` (RED first)

**Files:**
- Modify: `__tests__/lib/tenant.test.ts`

- [ ] **Step 1: Substituir os testes existentes pelos novos casos**

Substituir o conteúdo de `__tests__/lib/tenant.test.ts` por:

```typescript
import { describe, it, expect } from 'vitest'
import { extractTenantSlug } from '@/lib/tenant'

describe('extractTenantSlug — marketing hosts', () => {
  it('retorna null para beautly.cloud (marketing)', () => {
    expect(extractTenantSlug('beautly.cloud')).toBeNull()
  })

  it('retorna null para www.beautly.cloud (marketing)', () => {
    expect(extractTenantSlug('www.beautly.cloud')).toBeNull()
  })

  it('retorna null para beautly.cloud com porta', () => {
    expect(extractTenantSlug('beautly.cloud:3000')).toBeNull()
  })
})

describe('extractTenantSlug — tenant subdomains', () => {
  it('extrai slug de subdomínio em produção', () => {
    expect(extractTenantSlug('clinica.beautly.cloud')).toBe('clinica')
  })

  it('extrai slug com hífen', () => {
    expect(extractTenantSlug('studio-beleza.beautly.cloud')).toBe('studio-beleza')
  })

  it('extrai slug ignorando porta', () => {
    expect(extractTenantSlug('demo.beautly.cloud:3000')).toBe('demo')
  })
})

describe('extractTenantSlug — dev e preview', () => {
  it('usa fallback padrão para localhost', () => {
    expect(extractTenantSlug('localhost')).toBe('demo')
  })

  it('usa fallback com porta para localhost', () => {
    expect(extractTenantSlug('localhost:3000')).toBe('demo')
  })

  it('usa fallback customizado para localhost', () => {
    expect(extractTenantSlug('localhost', 'meu-tenant')).toBe('meu-tenant')
  })

  it('usa fallback para 127.0.0.1', () => {
    expect(extractTenantSlug('127.0.0.1')).toBe('demo')
  })

  it('usa fallback para preview Vercel', () => {
    expect(extractTenantSlug('beautly-git-feature.vercel.app', 'demo')).toBe('demo')
  })

  it('não falha com host vazio', () => {
    expect(extractTenantSlug('', 'demo')).toBe('demo')
  })
})
```

- [ ] **Step 2: Rodar testes e confirmar falhas esperadas**

```bash
cd /home/fabio/Projetos/Beautly
npm test -- --run __tests__/lib/tenant.test.ts
```

Expected: FAIL — `beautly.cloud` retorna `'demo'` em vez de `null` (não está em `MARKETING_HOSTS`).

---

### Task 2: Atualizar `lib/tenant.ts`

**Files:**
- Modify: `lib/tenant.ts`

- [ ] **Step 1: Atualizar `MARKETING_HOSTS` e exportar o set**

Substituir o bloco de `MARKETING_HOSTS` e a função `extractTenantSlug` em `lib/tenant.ts`:

```typescript
export const MARKETING_HOSTS = new Set([
  'beautly.cloud',
  'www.beautly.cloud',
])

/**
 * Extrai o tenant slug do host.
 * Retorna null para hosts de marketing (beautly.cloud, www.beautly.cloud).
 * Retorna o fallback para ambientes de dev/preview.
 */
export function extractTenantSlug(host: string, fallback = 'demo'): string | null {
  const hostname = host.split(':')[0]

  // Hosts de marketing — sem tenant
  if (MARKETING_HOSTS.has(hostname)) return null

  // Dev local
  if (hostname === 'localhost' || hostname === '127.0.0.1') return fallback

  // Preview Vercel
  if (hostname.endsWith('.vercel.app')) return fallback

  // Produção: extrai o primeiro segmento do subdomínio
  const parts = hostname.split('.')
  if (parts.length >= 3) return parts[0]

  return fallback
}
```

> **Atenção:** O bloco `if (hostname === 'admin.beautly.com') return null` foi **removido** — esse domínio não é mais usado. O comentário do JSDoc também foi atualizado.

- [ ] **Step 2: Rodar testes**

```bash
cd /home/fabio/Projetos/Beautly
npm test -- --run __tests__/lib/tenant.test.ts
```

Expected: PASS — todos os casos verdes.

- [ ] **Step 3: Commit**

```bash
git add lib/tenant.ts __tests__/lib/tenant.test.ts
git commit -m "feat(tenant): migrate marketing hosts to beautly.cloud, export MARKETING_HOSTS"
```

---

## Chunk 2: middleware.ts

### Task 3: Atualizar testes do middleware (RED first)

**Files:**
- Modify: `__tests__/middleware.test.ts`

- [ ] **Step 1: Substituir os testes existentes pelos novos casos**

Substituir o conteúdo de `__tests__/middleware.test.ts` por:

```typescript
import { describe, it, expect } from 'vitest'
import { extractTenantSlug, MARKETING_HOSTS } from '@/lib/tenant'

// Os testes do middleware validam a lógica de resolução de contexto
// que o middleware.ts executa. O NextRequest não é instanciado aqui —
// testamos as funções puras que o middleware usa.

describe('resolução de contexto — marketing', () => {
  it('beautly.cloud é host de marketing', () => {
    expect(MARKETING_HOSTS.has('beautly.cloud')).toBe(true)
  })

  it('www.beautly.cloud é host de marketing', () => {
    expect(MARKETING_HOSTS.has('www.beautly.cloud')).toBe(true)
  })

  it('extractTenantSlug retorna null para beautly.cloud', () => {
    expect(extractTenantSlug('beautly.cloud')).toBeNull()
  })

  it('extractTenantSlug retorna null para www.beautly.cloud', () => {
    expect(extractTenantSlug('www.beautly.cloud')).toBeNull()
  })
})

describe('resolução de contexto — super admin', () => {
  // Super admin é detectado pelo middleware por host === beautly.cloud + path /admin
  // tenant.ts retorna null para beautly.cloud — o middleware então checa o path

  it('beautly.cloud não é host de tenant', () => {
    expect(extractTenantSlug('beautly.cloud')).toBeNull()
  })

  it('www.beautly.cloud/admin NÃO é super admin — é marketing', () => {
    // www.beautly.cloud sempre é marketing, independente do path
    expect(MARKETING_HOSTS.has('www.beautly.cloud')).toBe(true)
    expect(extractTenantSlug('www.beautly.cloud')).toBeNull()
  })
})

describe('resolução de contexto — tenant', () => {
  it('demo.beautly.cloud retorna slug demo', () => {
    expect(extractTenantSlug('demo.beautly.cloud')).toBe('demo')
  })

  it('clinica.beautly.cloud retorna slug clinica', () => {
    expect(extractTenantSlug('clinica.beautly.cloud')).toBe('clinica')
  })
})

describe('resolução de contexto — dev e preview', () => {
  it('localhost usa fallback', () => {
    expect(extractTenantSlug('localhost', 'demo')).toBe('demo')
  })

  it('preview Vercel usa fallback', () => {
    expect(extractTenantSlug('beautly-git-feature-branch.vercel.app', 'demo')).toBe('demo')
  })
})
```

- [ ] **Step 2: Rodar testes**

```bash
cd /home/fabio/Projetos/Beautly
npm test -- --run __tests__/middleware.test.ts
```

Expected: PASS — estes testes são **intencionalmente verde desde o início**. Eles testam apenas funções puras de `lib/tenant.ts` (`extractTenantSlug` e `MARKETING_HOSTS`), que já foram atualizadas no Chunk 1. Não há fase RED aqui porque nenhuma nova lógica de produção está sendo adicionada nesta task — apenas novos casos de teste sobre código já implementado.

---

### Task 4: Atualizar `middleware.ts`

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Reescrever o middleware**

Substituir o conteúdo de `middleware.ts` por:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { extractTenantSlug, MARKETING_HOSTS } from '@/lib/tenant'

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const hostname = host.split(':')[0]
  const pathname = req.nextUrl.pathname

  // Contexto super admin — beautly.cloud + path /admin/*
  // O rewrite /admin/* → /super-admin/* é feito via vercel.json na cloud.
  // Em dev local, acessar /super-admin diretamente.
  if (hostname === 'beautly.cloud' && pathname.startsWith('/admin')) {
    const res = NextResponse.next()
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
```

- [ ] **Step 2: Rodar todos os testes**

```bash
cd /home/fabio/Projetos/Beautly
npm test -- --run
```

Expected: PASS — nenhum teste quebrado.

- [ ] **Step 3: Verificar lint**

```bash
cd /home/fabio/Projetos/Beautly
npm run lint
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts __tests__/middleware.test.ts
git commit -m "feat(middleware): replace superAdminHosts with path-based detection on beautly.cloud"
```

---

## Chunk 3: vercel.json + verificação final

### Task 5: Substituir `vercel.json`

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Substituir o arquivo**

Substituir o conteúdo de `vercel.json` por:

```json
{
  "rewrites": [
    {
      "source": "/admin/:path*",
      "destination": "/super-admin/:path*",
      "has": [{ "type": "host", "value": "beautly.cloud" }]
    }
  ]
}
```

> O campo `"alias": ["beautly-admin.vercel.app"]` foi **removido** — esse alias não é mais usado.
>
> O campo `has` garante que o rewrite só se aplica quando `host === beautly.cloud`.
> Requests em `{slug}.beautly.cloud/admin` **não são reescritos** e servem `app/admin/` normalmente.

- [ ] **Step 2: Verificar build local**

```bash
cd /home/fabio/Projetos/Beautly
npm run build
```

Expected: build sem erros.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat(vercel): replace legacy alias with conditional rewrite for beautly.cloud/admin"
```

---

### Task 6: Configurar domínio no Vercel e DNS

> Esta task envolve ações no painel web — não há comandos de código.

- [ ] **Step 1: Adicionar domínios no painel Vercel**

No painel do projeto Vercel (Settings → Domains), adicionar:
- `beautly.cloud`
- `*.beautly.cloud`

- [ ] **Step 2: Configurar DNS no registrador do domínio**

No painel DNS do `beautly.cloud`, criar dois registros CNAME:

```
beautly.cloud        CNAME  cname.vercel-dns.com
*.beautly.cloud      CNAME  cname.vercel-dns.com
```

> Alguns registradores representam o apex (`beautly.cloud`) como `@` no campo nome.

- [ ] **Step 3: Aguardar propagação DNS e verificar**

Após propagação (geralmente 5–30 minutos), verificar:
- `https://beautly.cloud` → marketing landing
- `https://beautly.cloud/admin` → super admin (login page)
- `https://demo.beautly.cloud` → tenant booking (se tenant `demo` existir)
- `https://demo.beautly.cloud/admin` → tenant admin login

- [ ] **Step 4: Commit de documentação (opcional)**

Se algum arquivo de configuração mudou durante a verificação:

```bash
git add .
git commit -m "chore(infra): finalize beautly.cloud domain configuration"
```
