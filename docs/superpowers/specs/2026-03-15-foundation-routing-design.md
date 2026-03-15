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

`extractTenantSlug` mantém a assinatura atual `(host, fallback)` — **não recebe `path`**. A detecção de super admin via path é responsabilidade exclusiva do middleware. O `tenant.ts` apenas determina se o host é marketing, tenant, ou fallback.

**Atualização obrigatória: `MARKETING_HOSTS`**

```typescript
const MARKETING_HOSTS = new Set([
  'beautly.cloud',
  'www.beautly.cloud',
  // remover: 'beautly.com', 'www.beautly.com', 'beautly.vercel.app'
])
```

`beautly.cloud` deve estar em `MARKETING_HOSTS` para retornar `null` — não é coberto pelo branch de subdomínio (apenas 2 partes após split por `.`), então sem essa entrada retornaria o fallback incorretamente.

**Lógica de resolução:**

```
Host em MARKETING_HOSTS (beautly.cloud, www.beautly.cloud)  →  retorna null
Host: {slug}.beautly.cloud (3 partes)                       →  retorna slug
Host: localhost / 127.0.0.1                                 →  retorna DEV_TENANT_SLUG || 'demo'
Host: *.vercel.app                                          →  retorna PREVIEW_TENANT_SLUG || 'demo'
```

### Middleware (`middleware.ts`)

**Remoção obrigatória:** remover o bloco `superAdminHosts` atual (que detecta `admin.beautly.com` e `beautly-admin.vercel.app`). Toda a lógica de super admin passa a ser baseada em host + path.

**Nova lógica:**

1. Lê host + pathname do request
2. Se `host === 'beautly.cloud'` **e** `pathname.startsWith('/admin')` → injeta `x-context: super-admin`, sem `x-tenant-slug`
3. Se host está em `MARKETING_HOSTS` (`beautly.cloud`, `www.beautly.cloud`) → injeta `x-context: marketing`, sem `x-tenant-slug` (`www.beautly.cloud/admin` não é um ponto de entrada de admin — serve marketing normalmente)
4. Caso contrário → chama `extractTenantSlug(host, fallback)`, injeta `x-tenant-slug: {slug}`, `x-context: tenant`

O **rewrite** de `/admin/*` → `/super-admin/*` é condicional ao host `beautly.cloud`, feito via `vercel.json` na cloud. Em dev local, o super admin é acessado diretamente em `/super-admin`.

**Rotas de API do super admin:** as rotas de API do super admin ficam em `app/api/super-admin/*` (path `/api/super-admin/*`), não em `/admin/api/*`. O rewrite não as afeta — estão fora do `source: /admin/:path*`.

### App Directory

```
app/
├── admin/           → tenant admin  ({slug}.beautly.cloud/admin)
├── super-admin/     → super admin   (beautly.cloud/admin, reescrito internamente)
├── api/
│   └── super-admin/ → API routes do super admin (/api/super-admin/*, não afetadas pelo rewrite)
├── book/            → booking flow  ({slug}.beautly.cloud)
└── _components/
    └── marketing/   → marketing landing (beautly.cloud)
```

Nenhum diretório muda de nome. O host + rewrite determinam qual folder serve.

---

## Vercel Configuration

### `vercel.json`

Substituir o arquivo atual integralmente (remover o campo `"alias": ["beautly-admin.vercel.app"]` legado):

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

O campo `has` garante que o rewrite só se aplica quando `host === beautly.cloud`. Requests em `{slug}.beautly.cloud/admin` **não são reescritos** e servem `app/admin/` normalmente.

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

Remover qualquer referência a `admin.beautly.com` ou `beautly-admin.vercel.app` em variáveis de ambiente ou código.

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

Assinatura usada nos testes: `extractTenantSlug(host, fallback?)` (sem parâmetro `path`).

```typescript
// Marketing (root domain) — coberto por MARKETING_HOSTS
extractTenantSlug('beautly.cloud') === null
extractTenantSlug('www.beautly.cloud') === null

// Tenant booking
extractTenantSlug('demo.beautly.cloud') === 'demo'

// Tenant admin — mesmo slug independente do path (path não é parâmetro)
extractTenantSlug('demo.beautly.cloud') === 'demo'

// Dev fallback
extractTenantSlug('localhost') === 'demo'

// Preview fallback
extractTenantSlug('beautly-git-branch.vercel.app') === 'demo'
```

### `__tests__/middleware.test.ts`

```typescript
// Marketing — host raiz sem /admin
// host: beautly.cloud, path: /
// → x-context: marketing, sem x-tenant-slug

// Marketing — www também é marketing, /admin NÃO roteia para super admin
// host: www.beautly.cloud, path: /admin
// → x-context: marketing, sem x-tenant-slug

// Super admin — apenas beautly.cloud (sem www) com /admin
// host: beautly.cloud, path: /admin
// → x-context: super-admin, sem x-tenant-slug

// Tenant booking
// host: demo.beautly.cloud, path: /
// → x-context: tenant, x-tenant-slug: demo

// Tenant admin — mesmo contexto tenant, independente do path
// host: demo.beautly.cloud, path: /admin
// → x-context: tenant, x-tenant-slug: demo
```

---

## Changes to Existing Foundation Plan

O plano `2026-03-14-foundation.md` deve ser atualizado para refletir:

1. **Domínio:** `beautly.com` → `beautly.cloud`
2. **Super admin:** remover bloco `superAdminHosts` (`admin.beautly.com`, `beautly-admin.vercel.app`); adicionar detecção por host + path (`beautly.cloud` + `/admin`)
3. **`MARKETING_HOSTS`:** substituir por `{ 'beautly.cloud', 'www.beautly.cloud' }`
4. **`vercel.json`:** remover campo `alias`; adicionar rewrite condicional por host
5. **Variáveis de ambiente:** remover referências a domínios legados
