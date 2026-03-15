# Foundation Routing Design — beautly.cloud

**Date:** 2026-03-15
**Status:** Approved
**Domain:** beautly.cloud

---

## Goal

Atualizar a resolução de host multi-tenant do projeto Beautly para usar o domínio `beautly.cloud`, com super admin acessível via path `/admin` na raiz do domínio (em vez de subdomínio separado).

---

## URL Structure

| URL | Contexto |
|-----|----------|
| `beautly.cloud` | Marketing landing (já funcionando) |
| `beautly.cloud/admin` | Super admin (rewrite interno → `/super-admin/*`) |
| `{slug}.beautly.cloud` | Booking do consumidor final |
| `{slug}.beautly.cloud/admin` | Painel admin do dono do comércio |

---

## Architecture

### Host Resolution (`lib/tenant.ts`)

A função `extractTenantSlug(host, path, fallback)` passa a receber o path como segundo argumento para distinguir super admin de marketing no host raiz.

```
Host: beautly.cloud
  path começa com /admin  →  contexto: super-admin  (retorna null + flag)
  outras paths            →  contexto: marketing     (retorna null)

Host: {slug}.beautly.cloud
  qualquer path           →  contexto: tenant        (retorna slug)

Host: localhost / 127.0.0.1  →  tenant (slug = DEV_TENANT_SLUG || 'demo')
Host: *.vercel.app            →  tenant (slug = PREVIEW_TENANT_SLUG || 'demo')
```

Marketing hosts: `beautly.cloud`, `www.beautly.cloud`

### Middleware (`middleware.ts`)

1. Lê host + pathname do request
2. Se `host === 'beautly.cloud'` e `pathname.startsWith('/admin')` → injeta `x-context: super-admin`, sem `x-tenant-slug`
3. Se `host === 'beautly.cloud'` → injeta `x-context: marketing`, sem `x-tenant-slug`
4. Se `host === '{slug}.beautly.cloud'` → injeta `x-tenant-slug: {slug}`, `x-context: tenant`
5. Dev/preview → injeta `x-tenant-slug: {fallback}`, `x-context: tenant`

O **rewrite** de `/admin/*` → `/super-admin/*` é condicional ao host `beautly.cloud`, feito via `vercel.json` na cloud. Em dev local, o super admin é acessado diretamente em `/super-admin`.

### App Directory

```
app/
├── admin/           → tenant admin  ({slug}.beautly.cloud/admin)
├── super-admin/     → super admin   (beautly.cloud/admin, reescrito internamente)
├── book/            → booking flow  ({slug}.beautly.cloud)
└── _components/
    └── marketing/   → marketing landing (beautly.cloud)
```

Nenhum diretório muda de nome. O host + rewrite determinam qual folder serve.

---

## Vercel Configuration

### `vercel.json`

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

### Domínios no painel Vercel

Adicionar ao projeto:
- `beautly.cloud`
- `*.beautly.cloud`

### DNS (`beautly.cloud`)

```
beautly.cloud        CNAME  cname.vercel-dns.com
*.beautly.cloud      CNAME  cname.vercel-dns.com
```

---

## Environment Variables

| Variável | Valor |
|----------|-------|
| `DEV_TENANT_SLUG` | `demo` (fallback local) |
| `PREVIEW_TENANT_SLUG` | `demo` (fallback preview Vercel) |

Remover qualquer referência a `admin.beautly.com` ou `beautly-admin.vercel.app`.

---

## Local Development

| URL | Contexto |
|-----|----------|
| `localhost:3000` | Tenant booking (slug = `DEV_TENANT_SLUG`) |
| `localhost:3000/admin` | Tenant admin |
| `localhost:3000/super-admin` | Super admin (acesso direto, sem rewrite) |

O rewrite do `vercel.json` não é executado localmente — o super admin é acessado diretamente em `/super-admin` durante desenvolvimento.

---

## Testing

### `__tests__/lib/tenant.test.ts`

Casos a cobrir:

```typescript
// Marketing (root domain)
extractTenantSlug('beautly.cloud', '/') === null

// Super admin (root domain + /admin path)
// Detectado no middleware, tenant.ts retorna null para beautly.cloud

// Tenant booking
extractTenantSlug('demo.beautly.cloud', '/book') === 'demo'

// Tenant admin (mesmo slug, path diferente)
extractTenantSlug('demo.beautly.cloud', '/admin') === 'demo'

// Dev fallback
extractTenantSlug('localhost', '/') === 'demo'

// Preview fallback
extractTenantSlug('beautly-git-branch.vercel.app', '/') === 'demo'
```

### `__tests__/middleware.test.ts`

- `beautly.cloud` + `/` → `x-context: marketing`, sem `x-tenant-slug`
- `beautly.cloud` + `/admin` → `x-context: super-admin`, sem `x-tenant-slug`
- `demo.beautly.cloud` + `/` → `x-context: tenant`, `x-tenant-slug: demo`
- `demo.beautly.cloud` + `/admin` → `x-context: tenant`, `x-tenant-slug: demo`

---

## Changes to Existing Foundation Plan

O plano `2026-03-14-foundation.md` deve ser atualizado para refletir:

1. Domínio: `beautly.com` → `beautly.cloud`
2. Super admin: subdomínio `admin.beautly.com` → path `beautly.cloud/admin` com rewrite
3. Marketing hosts: atualizar lista para `beautly.cloud`, `www.beautly.cloud`
4. `middleware.ts`: adicionar detecção de path para super admin no host raiz
5. `vercel.json`: adicionar rewrite condicional por host
