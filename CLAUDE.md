# Beautly — Instruções para Claude

## Produto

Beautly é um SaaS multi-tenant para estúdios e profissionais de beleza. Permite que donas de estética gerenciem agenda, serviços e profissionais, enquanto clientes fazem agendamentos online.

**Usuários:**
- `beautly.cloud` — Landing page de marketing (venda do SaaS)
- `beautly.cloud/admin` — Super admin da Beautly (Fabio) — cria e gerencia tenants
- `{slug}.beautly.cloud` — Página pública de booking do consumidor final
- `{slug}.beautly.cloud/admin` — Painel da dona do estúdio

---

## Stack

- **Next.js 15** App Router, sem src dir
- **TypeScript 5**, **Tailwind CSS 4**, **shadcn/ui**
- **Supabase** (`@supabase/ssr`) — auth de tenant + banco PostgreSQL
- **jose** v6 — JWT para super admin
- **bcryptjs** v3 — hash de senha
- **zod** — validação de schemas
- **date-fns** v4 + **date-fns-tz** — datas com timezone
- **Vitest** — testes unitários
- **Vercel** — deploy

---

## Arquitetura Multi-Tenant

### Resolução de host (`lib/tenant.ts`)

```
beautly.cloud               → marketing (null)
www.beautly.cloud           → marketing (null)
beautly.cloud + /admin/*    → super-admin (rewrite interno → /super-admin/*)
{slug}.beautly.cloud        → tenant (slug extraído do subdomínio)
localhost / 127.0.0.1       → tenant (DEV_TENANT_SLUG || 'demo')
*.vercel.app                → tenant (PREVIEW_TENANT_SLUG || 'demo')
```

`MARKETING_HOSTS` está em `lib/tenant.ts` e é exportado para uso no middleware.

### Middleware (`middleware.ts`)

Roda no Edge. Em ordem:
1. `beautly.cloud + /admin` → rewrite para `/super-admin/*`, injeta `x-context: super-admin`
2. `MARKETING_HOSTS` → injeta `x-context: marketing`
3. Todo o resto → injeta `x-tenant-slug: {slug}` + `x-context: tenant` + refresh Supabase JWT

**`x-tenant-slug` deve ser injetado nos request headers** (não só no response) para que Server Components possam lê-lo via `headers()`.

### Auth

| Contexto | Sistema | Lib |
|----------|---------|-----|
| Super admin | JWT em cookie `sa_token` | `jose` + `lib/super-admin/auth.ts` |
| Tenant admin | Supabase Auth em cookies | `@supabase/ssr` + `lib/admin/auth.ts` |

### Banco de dados

- PostgreSQL compartilhado com isolamento por `tenant_id`
- RLS ativo para operações autenticadas
- `createSupabaseServiceClient()` + filtro explícito `tenant_id` em Server Actions e APIs
- Migrations via Supabase CLI em `supabase/migrations/`

---

## Estrutura do app/

```
app/
├── page.tsx                        → Landing marketing
├── _components/marketing/          → Componentes da landing
├── book/                           → Booking flow público ({slug}.beautly.cloud)
│   └── [step]/actions.ts           → Server Action confirmBooking()
├── b/[token]/                      → Link público de visualização do agendamento
├── admin/                          → Painel do tenant
│   ├── login/                      → Login Supabase Auth
│   └── (protected)/                → Rotas autenticadas (layout faz requireAdmin())
│       ├── schedule/
│       ├── professionals/
│       ├── services/
│       └── [feature]/actions.ts    → Server Actions co-localizadas
├── super-admin/                    → Super admin (acesso via beautly.cloud/admin)
│   ├── login/                      → Login JWT
│   └── page.tsx                    → Dashboard de tenants
└── api/
    ├── super-admin/auth/           → POST login / POST logout
    └── super-admin/tenants/        → CRUD de tenants
```

### Convenções

- Server Components por padrão; Client Components só quando há interatividade
- Server Actions em `[feature]/actions.ts`, nunca em rotas de API desnecessárias
- Sem route groups para páginas públicas; `(protected)` só dentro de admin
- Dados de UI em arquivos `*-data.ts` separados do JSX

---

## Design System & Stitch — OBRIGATÓRIO

**Todo componente ou tela visual nova deve seguir este fluxo:**

### 1. Verificar se a tela existe no Stitch

Usar `mcp__stitch__list_screens` no projeto `4065108259203499740` (Beautly Design System PRD).

### 2. Se a tela NÃO existir → criar no Stitch primeiro

Usar `mcp__stitch__generate_screen_from_text` descrevendo:
- Layout e seções da tela
- Componentes e dados exibidos
- Contexto (admin do tenant / booking / super admin / marketing)

**Criar sempre as duas versões:**
- **Desktop** (1280px+)
- **Mobile** (390px) — este SaaS é **mobile-first**

### 3. Se a tela JÁ existir → inspecionar antes de codar

Usar `mcp__stitch__get_screen` para extrair:
- Ordem das seções
- Paleta de cores e tipografia
- Labels dos CTAs
- Estrutura visual dominante

### 4. Implementar com fidelidade ao Stitch

- Seguir cores, espaçamentos e hierarquia visual do protótipo
- Usar Tailwind no padrão do projeto (sem CSS inline salvo em componentes legados do super-admin)
- Mobile-first: breakpoints `sm:` para desktop, base para mobile

### Design System (tema Stitch)

| Token | Valor |
|-------|-------|
| Cor primária | `#ec4699` (pink) |
| Fonte | Inter |
| Border radius | 8px |
| Modo | Light |
| Saturação | Alta |

---

## Desenvolvimento Local

```
localhost:3000              → booking tenant (DEV_TENANT_SLUG)
localhost:3000/admin        → admin do tenant
localhost:3000/super-admin  → super admin (sem rewrite local)
```

**`.env.local` necessário:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEV_TENANT_SLUG=demo
PREVIEW_TENANT_SLUG=demo
SUPER_ADMIN_EMAIL=admin@beautly.local
SUPER_ADMIN_PASSWORD_HASH=<bcrypt de admin123>
JWT_SECRET=dev-only-secret
```

---

## Testes

- Framework: **Vitest** (`npm test -- --run`)
- Abordagem: **TDD** — testes antes da implementação
- Funções puras (resolução de slug, disponibilidade, JWT) testadas isoladamente
- Sem mocks de banco — testes de integração usam Supabase local real

---

## Workflow com Superpowers

- **Antes de qualquer feature nova:** invocar `superpowers:brainstorming`
- **Antes de qualquer bug fix:** invocar `superpowers:systematic-debugging`
- **Planos** salvos em `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`
- **Specs** salvas em `docs/superpowers/specs/YYYY-MM-DD-<feature>-design.md`
- **Commits** frequentes, convenção: `feat|fix|chore|docs(escopo): mensagem`

---

## O que NUNCA fazer

- Alterar `lib/tenant.ts` ou `middleware.ts` sem revisar o spec de routing (`docs/superpowers/specs/2026-03-15-foundation-routing-design.md`)
- Criar componente visual sem consultar o Stitch primeiro
- Fazer deploy/push sem confirmação explícita do Fabio
- Usar `any` em TypeScript
- Chamar `createSupabaseServiceClient()` em Client Components
- Fazer rewrite de URL no `vercel.json` (a lógica fica no middleware)
