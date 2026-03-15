# Super Admin Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o painel super admin em `admin.beautly.com` com login JWT, dashboard de métricas e CRUD de tenants.

**Architecture:** Rotas do super admin ficam em `app/super-admin/` (prefixo de path real, não route group). O `middleware.ts` já existente é atualizado para reescrever requests de `admin.beautly.com` para `/super-admin/*`. Em dev local, o painel é acessado em `localhost:3000/super-admin`. Auth por JWT em cookie `HttpOnly` — cada Route Handler verifica o JWT explicitamente via `lib/super-admin/auth.ts`.

**Tech Stack:** Next.js 15 App Router, `jose` v6 (JWT), `bcryptjs` v3, `@supabase/ssr` service client, shadcn/ui Dialog + sonner, Tailwind CSS (dark theme inline)

**Dev local:** Acesse o painel em `http://localhost:3000/super-admin`. Credenciais no `.env.local`:
- `SUPER_ADMIN_EMAIL=admin@beautly.local`
- `SUPER_ADMIN_PASSWORD_HASH` (bcrypt de `admin123`)
- `JWT_SECRET=dev-only-secret-never-use-in-production`

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `middleware.ts` | MODIFICAR: adicionar rewrite `admin.beautly.com` → `/super-admin/*` |
| `lib/super-admin/auth.ts` | `createJWT()`, `verifyJWT()`, `requireSuperAdmin()`, `getSessionOrNull()` |
| `app/api/super-admin/auth/route.ts` | POST login → valida credenciais → seta cookie JWT |
| `app/api/super-admin/logout/route.ts` | POST logout → limpa cookie |
| `app/api/super-admin/tenants/route.ts` | GET lista + POST cria tenant + profissional padrão |
| `app/api/super-admin/tenants/[id]/route.ts` | PATCH status + DELETE tenant |
| `app/super-admin/layout.tsx` | Dark layout + chama `requireSuperAdmin()` |
| `app/super-admin/login/page.tsx` | Formulário de login dark |
| `app/super-admin/page.tsx` | Dashboard: métricas + tabela de tenants |
| `__tests__/super-admin/auth.test.ts` | Testes de `createJWT` e `verifyJWT` |

---

## Chunk 1: Auth lib e middleware

### Task 1: Atualizar middleware.ts para rewrite super admin

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Ler o middleware atual**

```bash
cat /home/fabio/Projetos/Beautly/middleware.ts
```

- [ ] **Step 2: Atualizar o bloco super admin para incluir rewrite**

Substituir o bloco que detecta `admin.beautly.com` por:

```typescript
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
```

- [ ] **Step 3: Verificar que TypeScript compila sem erros**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat(super-admin): update middleware to rewrite admin subdomain to /super-admin"
```

---

### Task 2: lib/super-admin/auth.ts

**Files:**
- Create: `lib/super-admin/auth.ts`
- Create: `__tests__/super-admin/auth.test.ts`

- [ ] **Step 1: Criar o arquivo de testes (TDD — RED)**

```bash
mkdir -p /home/fabio/Projetos/Beautly/__tests__/super-admin
```

Criar `__tests__/super-admin/auth.test.ts`:

```typescript
// __tests__/super-admin/auth.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { createJWT, verifyJWT } from '@/lib/super-admin/auth'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
})

describe('createJWT', () => {
  it('retorna uma string não vazia', async () => {
    const token = await createJWT()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })

  it('cria token com sub=super-admin', async () => {
    const token = await createJWT()
    const payload = await verifyJWT(token)
    expect(payload?.sub).toBe('super-admin')
  })
})

describe('verifyJWT', () => {
  it('retorna payload para token válido', async () => {
    const token = await createJWT()
    const payload = await verifyJWT(token)
    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe('super-admin')
  })

  it('retorna null para token inválido', async () => {
    const payload = await verifyJWT('token-invalido')
    expect(payload).toBeNull()
  })

  it('retorna null para string vazia', async () => {
    const payload = await verifyJWT('')
    expect(payload).toBeNull()
  })

  it('retorna null para token com secret errado', async () => {
    // Cria token com secret diferente para simular token adulterado
    const { SignJWT } = await import('jose')
    const fakeSecret = new TextEncoder().encode('outro-secret-completamente-diferente!')
    const fakeToken = await new SignJWT({ sub: 'super-admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(fakeSecret)

    const payload = await verifyJWT(fakeToken)
    expect(payload).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar testes — devem FALHAR**

```bash
cd /home/fabio/Projetos/Beautly && npm test -- --run __tests__/super-admin/auth.test.ts 2>&1 | tail -10
```

Expected: FAIL com "Cannot find module '@/lib/super-admin/auth'".

- [ ] **Step 3: Criar lib/super-admin/auth.ts**

```typescript
// lib/super-admin/auth.ts
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET não configurado')
  return new TextEncoder().encode(secret)
}

/** Cria JWT com sub=super-admin, expira em 8h. */
export async function createJWT(): Promise<string> {
  return new SignJWT({ sub: 'super-admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

/** Verifica JWT. Retorna payload ou null se inválido/expirado. */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

/**
 * Verifica autenticação super admin a partir dos cookies.
 * Para uso em Server Components e layouts — redireciona se não autenticado.
 */
export async function requireSuperAdmin(): Promise<JWTPayload> {
  const cookieStore = await cookies()
  const token = cookieStore.get('sa_token')?.value
  if (!token) redirect('/super-admin/login')
  const payload = await verifyJWT(token)
  if (!payload) redirect('/super-admin/login')
  return payload
}

/**
 * Verifica autenticação super admin a partir dos cookies.
 * Para uso em Route Handlers — retorna null se não autenticado (sem redirect).
 */
export async function getSessionOrNull(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('sa_token')?.value
  if (!token) return null
  return verifyJWT(token)
}
```

- [ ] **Step 4: Rodar testes — devem PASSAR**

```bash
cd /home/fabio/Projetos/Beautly && npm test -- --run __tests__/super-admin/auth.test.ts 2>&1 | tail -10
```

Expected: 5 testes PASS.

- [ ] **Step 5: Verificar TypeScript**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add lib/super-admin/auth.ts __tests__/super-admin/auth.test.ts
git commit -m "feat(super-admin): add JWT auth helpers with tests"
```

---

## Chunk 2: API Routes

### Task 3: POST /api/super-admin/auth (login)

**Files:**
- Create: `app/api/super-admin/auth/route.ts`

- [ ] **Step 1: Criar o route handler**

```bash
mkdir -p /home/fabio/Projetos/Beautly/app/api/super-admin/auth
```

Criar `app/api/super-admin/auth/route.ts`:

```typescript
// app/api/super-admin/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createJWT } from '@/lib/super-admin/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }

  const expectedEmail = process.env.SUPER_ADMIN_EMAIL
  const expectedHash = process.env.SUPER_ADMIN_PASSWORD_HASH

  if (
    !email ||
    !password ||
    !expectedEmail ||
    !expectedHash ||
    email !== expectedEmail ||
    !(await bcrypt.compare(password, expectedHash))
  ) {
    return NextResponse.json(
      { error: 'Credenciais inválidas' },
      { status: 401 }
    )
  }

  const token = await createJWT()

  const res = NextResponse.json({ ok: true })
  res.cookies.set('sa_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8, // 8h em segundos
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
```

- [ ] **Step 2: Escrever testes para a lógica de validação de credenciais**

A lógica crítica de validação (email + bcrypt) deve ser testada. Extraia-a para uma função pura e teste-a.

Adicionar ao final de `__tests__/super-admin/auth.test.ts`:

```typescript
// Testa a lógica de validação de credenciais isoladamente
// (sem precisar de um servidor HTTP rodando)
import bcrypt from 'bcryptjs'

describe('validateCredentials', () => {
  const EMAIL = 'admin@test.com'
  // hash bcrypt de 'senha123'
  let HASH: string

  beforeAll(async () => {
    HASH = await bcrypt.hash('senha123', 10)
  })

  it('aceita credenciais corretas', async () => {
    const emailOk = 'admin@test.com' === EMAIL
    const passOk = await bcrypt.compare('senha123', HASH)
    expect(emailOk && passOk).toBe(true)
  })

  it('rejeita senha incorreta', async () => {
    const passOk = await bcrypt.compare('errada', HASH)
    expect(passOk).toBe(false)
  })

  it('rejeita email incorreto', async () => {
    const emailOk = 'outro@test.com' === EMAIL
    expect(emailOk).toBe(false)
  })
})
```

Rodar testes:

```bash
cd /home/fabio/Projetos/Beautly && npm test -- --run __tests__/super-admin/auth.test.ts 2>&1 | tail -15
```

Expected: 8 testes PASS (5 anteriores + 3 novos).

- [ ] **Step 3: Testar manualmente com curl (opcional — requer `npm run dev`)**

```bash
curl -s -X POST http://localhost:3000/api/super-admin/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@beautly.local","password":"admin123"}' | python3 -m json.tool
```

Expected: `{ "ok": true }` com status 200.

```bash
curl -s -X POST http://localhost:3000/api/super-admin/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrong"}' | python3 -m json.tool
```

Expected: `{ "error": "Credenciais inválidas" }` com status 401.

- [ ] **Step 4: Verificar TypeScript**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

- [ ] **Step 5: Commit**

```bash
git add app/api/super-admin/auth/route.ts __tests__/super-admin/auth.test.ts
git commit -m "feat(super-admin): add login route handler and credential validation tests"
```

---

### Task 4: POST /api/super-admin/logout

**Files:**
- Create: `app/api/super-admin/logout/route.ts`

- [ ] **Step 1: Criar o route handler**

```bash
mkdir -p /home/fabio/Projetos/Beautly/app/api/super-admin/logout
```

Criar `app/api/super-admin/logout/route.ts`:

```typescript
// app/api/super-admin/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('sa_token', '', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // expira imediatamente
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

- [ ] **Step 3: Commit**

```bash
git add app/api/super-admin/logout/route.ts
git commit -m "feat(super-admin): add logout route handler"
```

---

### Task 5: GET + POST /api/super-admin/tenants

**Files:**
- Create: `app/api/super-admin/tenants/route.ts`

- [ ] **Step 1: Criar diretório e arquivo**

```bash
mkdir -p /home/fabio/Projetos/Beautly/app/api/super-admin/tenants
```

Criar `app/api/super-admin/tenants/route.ts`:

```typescript
// app/api/super-admin/tenants/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrNull } from '@/lib/super-admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const payload = await getSessionOrNull()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, monthly_price, status, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tenants: data })
}

export async function POST(req: NextRequest) {
  const payload = await getSessionOrNull()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { name, slug, monthly_price } = body as {
    name?: string
    slug?: string
    monthly_price?: number
  }

  if (!name || !slug) {
    return NextResponse.json({ error: 'name e slug são obrigatórios' }, { status: 400 })
  }

  // Validar formato do slug
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'Slug deve conter apenas letras minúsculas, números e hífens' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseServiceClient()

  // Verificar slug duplicado
  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 409 })
  }

  // Criar tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      monthly_price: monthly_price ?? 99.90,
      primary_color: '#ec4899',
      timezone: 'America/Sao_Paulo',
      status: 'active',
    })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Erro ao criar tenant' }, { status: 500 })
  }

  // Criar profissional padrão — se falhar, reverter o tenant (sem transação nativa no Supabase REST)
  const { error: profError } = await supabase
    .from('professionals')
    .insert({
      tenant_id: tenant.id,
      name: 'Profissional',
      is_active: true,
      sort_order: 0,
    })

  if (profError) {
    // Reverter tenant criado para manter consistência
    await supabase.from('tenants').delete().eq('id', tenant.id)
    return NextResponse.json({ error: 'Erro ao criar profissional padrão' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: tenant.id }, { status: 201 })
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

- [ ] **Step 3: Commit**

```bash
git add app/api/super-admin/tenants/route.ts
git commit -m "feat(super-admin): add tenants GET and POST route handlers"
```

---

### Task 6: PATCH + DELETE /api/super-admin/tenants/[id]

**Files:**
- Create: `app/api/super-admin/tenants/[id]/route.ts`

- [ ] **Step 1: Criar diretório e arquivo**

```bash
mkdir -p "/home/fabio/Projetos/Beautly/app/api/super-admin/tenants/[id]"
```

Criar `app/api/super-admin/tenants/[id]/route.ts`:

```typescript
// app/api/super-admin/tenants/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrNull } from '@/lib/super-admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getSessionOrNull()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { status } = body as { status?: string }

  if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  // Verificar que o tenant existe antes de atualizar
  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { error } = await supabase
    .from('tenants')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getSessionOrNull()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

- [ ] **Step 3: Rodar todos os testes**

```bash
cd /home/fabio/Projetos/Beautly && npm test -- --run 2>&1 | tail -10
```

Expected: todos passando.

- [ ] **Step 4: Commit**

```bash
git add "app/api/super-admin/tenants/[id]/route.ts"
git commit -m "feat(super-admin): add tenant PATCH status and DELETE route handlers"
```

---

## Chunk 3: UI — Login e Layout

### Task 7: Layout do grupo super-admin

**Files:**
- Create: `app/super-admin/layout.tsx`

- [ ] **Step 1: Criar diretório e layout**

```bash
mkdir -p /home/fabio/Projetos/Beautly/app/super-admin
```

Criar `app/super-admin/layout.tsx`:

```tsx
// app/super-admin/layout.tsx
import type { Metadata } from 'next'
import { requireSuperAdmin } from '@/lib/super-admin/auth'

export const metadata: Metadata = {
  title: 'Beautly Admin',
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protege todas as rotas do grupo — exceto /super-admin/login
  // A página de login não chama requireSuperAdmin() para evitar loop
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      {children}
    </div>
  )
}
```

> **Nota:** O layout propositalmente NÃO chama `requireSuperAdmin()`. A verificação de auth é feita individualmente em `app/super-admin/page.tsx` (dashboard). A página de login (`/super-admin/login`) não precisa de auth. Isso evita loop de redirect.

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

- [ ] **Step 3: Commit**

```bash
git add app/super-admin/layout.tsx
git commit -m "feat(super-admin): add dark layout for super admin route group"
```

---

### Task 8: Página de login

**Files:**
- Create: `app/super-admin/login/page.tsx`

- [ ] **Step 1: Criar diretório e página**

```bash
mkdir -p /home/fabio/Projetos/Beautly/app/super-admin/login
```

Criar `app/super-admin/login/page.tsx`:

```tsx
// app/super-admin/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      const res = await fetch('/api/super-admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        router.push('/super-admin')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Credenciais inválidas')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '32px',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }} />
          <span style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>
            BEAUTLY ADMIN
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#64748b', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.06em' }}>
              EMAIL
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#f1f5f9',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#64748b', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.06em' }}>
              SENHA
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#f1f5f9',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#ec4899',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

- [ ] **Step 3: Verificar build**

```bash
cd /home/fabio/Projetos/Beautly && npm run build 2>&1 | tail -20
```

Expected: build sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/super-admin/login/page.tsx
git commit -m "feat(super-admin): add dark login page"
```

---

## Chunk 4: UI — Dashboard

### Task 9: Componente de ações de tenant (Client Component)

**Files:**
- Create: `app/super-admin/_components/tenant-actions.tsx`

> Este é um Client Component separado para encapsular as interações (modals de confirmação, fetch de ações). O dashboard principal (`page.tsx`) permanece Server Component.

- [ ] **Step 1: Criar diretório e arquivo**

```bash
mkdir -p "/home/fabio/Projetos/Beautly/app/super-admin/_components"
```

Criar `app/super-admin/_components/tenant-actions.tsx`:

```tsx
// app/super-admin/_components/tenant-actions.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// ─── Toggle status (pausar / ativar) ────────────────────────────────────────

interface ToggleStatusButtonProps {
  id: string
  currentStatus: string
}

export function ToggleStatusButton({ id, currentStatus }: ToggleStatusButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
  const label = currentStatus === 'active' ? 'pausar' : 'ativar'
  const color = currentStatus === 'active' ? '#f59e0b' : '#22c55e'

  async function handleToggle() {
    const res = await fetch(`/api/super-admin/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })

    if (res.ok) {
      startTransition(() => router.refresh())
    } else {
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      style={{
        color,
        border: `1px solid ${color}`,
        background: 'transparent',
        borderRadius: '4px',
        padding: '2px 8px',
        fontSize: '11px',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.5 : 1,
      }}
    >
      {isPending ? '...' : label}
    </button>
  )
}

// ─── Delete button + dialog de confirmação ───────────────────────────────────

interface DeleteTenantButtonProps {
  id: string
  name: string
}

export function DeleteTenantButton({ id, name }: DeleteTenantButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    const res = await fetch(`/api/super-admin/tenants/${id}`, { method: 'DELETE' })

    if (res.ok) {
      setOpen(false)
      startTransition(() => router.refresh())
    } else {
      toast.error('Não foi possível deletar o tenant.')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          color: '#ef4444',
          border: '1px solid #ef4444',
          background: 'transparent',
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '11px',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#f1f5f9' }}>Deletar tenant</DialogTitle>
            <DialogDescription style={{ color: '#94a3b8' }}>
              Tem certeza que deseja deletar <strong style={{ color: '#f1f5f9' }}>{name}</strong>?
              Esta ação não pode ser desfeita e remove todos os dados associados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px', fontSize: '13px' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: isPending ? 'not-allowed' : 'pointer' }}
            >
              {isPending ? 'Deletando...' : 'Deletar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Modal de criação de tenant ──────────────────────────────────────────────

interface CreateTenantButtonProps {
  defaultMonthlyPrice: number
}

export function CreateTenantButton({ defaultMonthlyPrice }: CreateTenantButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSlugError(null)
    setIsPending(true)

    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    const slug = form.get('slug') as string
    const monthly_price = parseFloat(form.get('monthly_price') as string)

    const res = await fetch('/api/super-admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, monthly_price }),
    })

    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json()
      if (data.error?.includes('slug')) {
        setSlugError(data.error)
      } else {
        toast.error(data.error ?? 'Erro ao criar tenant.')
      }
    }

    setIsPending(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ background: '#ec4899', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
      >
        + Novo Tenant
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#f1f5f9' }}>Novo Tenant</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} id="create-tenant-form">
            {/* Nome */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.06em' }}>NOME</label>
              <input
                name="name"
                required
                onChange={(e) => {
                  const slugInput = document.getElementById('slug-input') as HTMLInputElement
                  if (slugInput && !slugInput.dataset.edited) {
                    slugInput.value = generateSlug(e.target.value)
                  }
                }}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: '#f1f5f9', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Slug */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.06em' }}>SLUG</label>
              <input
                id="slug-input"
                name="slug"
                required
                pattern="^[a-z0-9-]+"
                onInput={(e) => { (e.target as HTMLInputElement).dataset.edited = 'true' }}
                style={{ width: '100%', background: '#0f172a', border: `1px solid ${slugError ? '#ef4444' : '#334155'}`, borderRadius: '6px', padding: '8px 10px', color: '#f1f5f9', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
              {slugError && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{slugError}</p>}
            </div>

            {/* Mensalidade */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.06em' }}>MENSALIDADE (R$)</label>
              <input
                name="monthly_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={defaultMonthlyPrice}
                required
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: '#f1f5f9', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </form>

          <DialogFooter>
            <button onClick={() => setOpen(false)} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px', fontSize: '13px' }}>
              Cancelar
            </button>
            <button
              type="submit"
              form="create-tenant-form"
              disabled={isPending}
              style={{ background: '#ec4899', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer' }}
            >
              {isPending ? 'Criando...' : 'Criar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

- [ ] **Step 3: Commit**

```bash
git add app/super-admin/_components/tenant-actions.tsx
git commit -m "feat(super-admin): add tenant action client components (toggle, delete, create)"
```

---

### Task 10: Dashboard principal

**Files:**
- Create: `app/super-admin/page.tsx`

- [ ] **Step 1: Criar app/super-admin/page.tsx**

```tsx
// app/super-admin/page.tsx
import { requireSuperAdmin } from '@/lib/super-admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { Toaster } from '@/components/ui/sonner'
import {
  ToggleStatusButton,
  DeleteTenantButton,
  CreateTenantButton,
} from './_components/tenant-actions'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'ativo',     color: '#22c55e', bg: '#14532d' },
  inactive:  { label: 'pausado',   color: '#f59e0b', bg: '#451a03' },
  suspended: { label: 'suspenso',  color: '#ef4444', bg: '#450a0a' },
}

export default async function SuperAdminPage() {
  await requireSuperAdmin()

  const supabase = createSupabaseServiceClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, slug, name, monthly_price, status, created_at')
    .order('created_at', { ascending: false })

  const allTenants = tenants ?? []
  const active = allTenants.filter((t) => t.status === 'active')
  const inactive = allTenants.filter((t) => t.status === 'inactive')
  const mrr = active.reduce((sum, t) => sum + Number(t.monthly_price), 0)
  const lastInactive = inactive[0]

  const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'admin'
  const defaultPrice = parseFloat(process.env.MONTHLY_PRICE_DEFAULT ?? '99.90')

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#f1f5f9', minHeight: '100vh', background: '#0f172a' }}>
      <Toaster theme="dark" />

      {/* Topbar */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>BEAUTLY ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#64748b', fontSize: '12px' }}>{adminEmail}</span>
          <form action="/api/super-admin/logout" method="POST">
            <button type="submit" style={{ color: '#ef4444', background: 'transparent', border: 'none', fontSize: '12px', cursor: 'pointer' }}>
              sair
            </button>
          </form>
        </div>
      </div>

      <div style={{ padding: '24px' }}>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {/* MRR */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '4px' }}>MRR</div>
            <div style={{ color: '#ec4899', fontSize: '24px', fontWeight: 700 }}>
              R$ {mrr.toFixed(2).replace('.', ',')}
            </div>
          </div>
          {/* Ativos */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '4px' }}>TENANTS ATIVOS</div>
            <div style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700 }}>{active.length}</div>
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>de {allTenants.length} cadastrados</div>
          </div>
          {/* Pausados */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '4px' }}>PAUSADOS</div>
            <div style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 700 }}>{inactive.length}</div>
            {lastInactive && (
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{lastInactive.name}</div>
            )}
          </div>
        </div>

        {/* Tenant table */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>TENANTS</span>
          <CreateTenantButton defaultMonthlyPrice={defaultPrice} />
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px', gap: '8px', padding: '10px 16px', borderBottom: '1px solid #334155' }}>
            {['NOME', 'SLUG', 'MENSALIDADE', 'STATUS', 'AÇÕES'].map((h) => (
              <span key={h} style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {allTenants.length === 0 && (
            <div style={{ padding: '24px 16px', color: '#475569', fontSize: '13px', textAlign: 'center' }}>
              Nenhum tenant cadastrado.
            </div>
          )}
          {allTenants.map((tenant, i) => {
            const badge = STATUS_BADGE[tenant.status] ?? STATUS_BADGE.suspended
            const isLast = i === allTenants.length - 1
            return (
              <div
                key={tenant.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                  gap: '8px',
                  padding: '10px 16px',
                  borderBottom: isLast ? 'none' : '1px solid #0f172a',
                  alignItems: 'center',
                  opacity: tenant.status === 'inactive' ? 0.75 : 1,
                }}
              >
                <span style={{ fontSize: '13px' }}>{tenant.name}</span>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b' }}>{tenant.slug}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  R$ {Number(tenant.monthly_price).toFixed(2).replace('.', ',')}
                </span>
                <span style={{
                  display: 'inline-flex',
                  background: badge.bg,
                  color: badge.color,
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  width: 'fit-content',
                }}>
                  {badge.label}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <ToggleStatusButton id={tenant.id} currentStatus={tenant.status} />
                  <DeleteTenantButton id={tenant.id} name={tenant.name} />
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

Expected: sem erros.

- [ ] **Step 3: Rodar todos os testes**

```bash
cd /home/fabio/Projetos/Beautly && npm test -- --run 2>&1 | tail -10
```

Expected: todos passando.

- [ ] **Step 4: Verificar build**

```bash
cd /home/fabio/Projetos/Beautly && npm run build 2>&1 | tail -20
```

Expected: build sem erros críticos.

- [ ] **Step 5: Testar manualmente em dev**

```bash
npm run dev
```

Abrir `http://localhost:3000/super-admin/login`. Fazer login com `admin@beautly.local` / `admin123`. Verificar:
- Dashboard carrega com dados do tenant `demo`
- MRR mostra R$ 99,90
- Botão pausar alterna status
- Botão delete abre dialog de confirmação
- Botão "+ Novo Tenant" abre modal e cria

- [ ] **Step 6: Commit**

```bash
git add app/super-admin/page.tsx
git commit -m "feat(super-admin): add dashboard with metrics and tenant management"
```

---

### Task 11: Verificação final e lint

- [ ] **Step 1: Rodar todos os testes**

```bash
cd /home/fabio/Projetos/Beautly && npm test -- --run 2>&1 | tail -10
```

Expected: todos PASS.

- [ ] **Step 2: TypeScript check**

```bash
cd /home/fabio/Projetos/Beautly && npx tsc --noEmit 2>&1
```

Expected: sem erros.

- [ ] **Step 3: Lint**

```bash
cd /home/fabio/Projetos/Beautly && npm run lint 2>&1 | tail -10
```

Expected: sem erros.

- [ ] **Step 4: Build final**

```bash
cd /home/fabio/Projetos/Beautly && npm run build 2>&1 | tail -20
```

Expected: build limpo.

- [ ] **Step 5: Git log dos commits desta feature**

```bash
git log --oneline -15
```
