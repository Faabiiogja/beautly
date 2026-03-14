# Beautly MVP — Design Spec

**Data:** 2026-03-14
**Status:** Em revisão
**Autor:** Fabio (produto) + Claude (arquitetura)

---

## 1. Visão Geral

SaaS multi-tenant de agendamento para estética feminina. Cada cliente (tenant) contrata uma assinatura mensal e recebe um subdomínio próprio (`nomedaestetica.beautly.com`). O cliente final agenda serviços sem criar conta — apenas nome e telefone, com acesso ao próprio agendamento via link único seguro enviado por WhatsApp.

### Objetivos do MVP

- Primeiro tenant real usando e pagando
- Dono da plataforma (Fabio) com visibilidade de clientes e MRR
- Base técnica preparada para crescer sem reescrita

---

## 2. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS + shadcn/ui |
| Banco | PostgreSQL via Supabase |
| Auth | Supabase Auth (tenants) + JWT próprio (super admin) |
| Storage | Supabase Storage (logos) |
| Deploy | Vercel (wildcard DNS) |
| WhatsApp | Meta Cloud API |
| Validação | Zod |
| Repositório | GitHub |

---

## 3. Arquitetura Geral

### Modelo

Next.js monolito com App Router. Uma única aplicação serve os três contextos via middleware no Edge:

```
Vercel Edge → middleware.ts (resolve tenant + contexto)
  ├── app/(super-admin)/   → admin.beautly.com
  ├── app/(admin)/         → nome.beautly.com/admin
  └── app/(booking)/       → nome.beautly.com
```

### Princípios

- **Shared database** com isolamento por `tenant_id`
- **Row Level Security** no Supabase como segunda camada de proteção
- **Server Components** como padrão — cliente recebe HTML, estado mínimo no browser
- **Middleware no Edge** não consulta banco — repassa slug via header
- **Domain-driven folders** — cada domínio tem queries, actions e types isolados

### Três Contextos de Acesso

| Contexto | URL | Auth |
|---|---|---|
| Super Admin (Fabio) | `admin.beautly.com` | JWT próprio via `.env` |
| Tenant Admin | `nome.beautly.com/admin` | Supabase Auth (email + senha) |
| Cliente Final | `nome.beautly.com` | Nenhuma — token seguro na URL |

---

## 4. Modelagem de Dados

### Tabelas

#### `tenants`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| slug | text UNIQUE | subdomínio |
| name | text | |
| logo_url | text | Supabase Storage |
| primary_color | text | hex |
| monthly_price | numeric(10,2) | por tenant — MVP popula com valor único |
| status | text | `active` \| `inactive` \| `suspended` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `tenant_users`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK→tenants | |
| user_id | uuid FK→auth.users | Supabase Auth |
| role | text | `owner` (futuro: `staff`) |
| created_at | timestamptz | |

#### `professionals`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK→tenants | |
| name | text | |
| bio | text | |
| avatar_url | text | |
| is_active | boolean DEFAULT true | |
| sort_order | int DEFAULT 0 | ordem de exibição |
| created_at | timestamptz | |

**Regra:** 1 profissional criado automaticamente ao criar tenant. Admin pode adicionar mais.

#### `services`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK→tenants | |
| name | text | |
| description | text | |
| price | numeric(10,2) | |
| duration_minutes | int | |
| buffer_minutes | int DEFAULT 0 | intervalo após o serviço |
| is_active | boolean DEFAULT true | |
| created_at | timestamptz | |

#### `customers`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK→tenants | |
| name | text | |
| phone | text | E.164 normalizado |
| created_at | timestamptz | |

**Constraint:** `UNIQUE(tenant_id, phone)` — mesmo telefone pode existir em tenants diferentes.

#### `bookings`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK→tenants | |
| customer_id | uuid FK→customers | |
| service_id | uuid FK→services | |
| professional_id | uuid FK→professionals | obrigatório |
| starts_at | timestamptz | |
| ends_at | timestamptz | gerado: starts_at + duration + buffer |
| status | text | `confirmed` \| `cancelled` \| `rescheduled` \| `completed` |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `booking_tokens`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| booking_id | uuid FK→bookings | |
| tenant_id | uuid FK→tenants | |
| token | text UNIQUE | 64 chars hex (256 bits) |
| expires_at | timestamptz | now() + 7 dias |
| used_at | timestamptz | nullable |
| revoked_at | timestamptz | nullable |
| created_at | timestamptz | |

#### `business_hours`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK→tenants | |
| day_of_week | int | 0=Dom … 6=Sáb |
| is_open | boolean DEFAULT true | |
| open_time | time | |
| close_time | time | |

**Constraint:** `UNIQUE(tenant_id, day_of_week)`
**MVP:** horário compartilhado por todos os profissionais. Futuro: adicionar `professional_id`.

#### `schedule_blocks`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK→tenants | |
| professional_id | uuid FK→professionals | NULL = bloqueia todos |
| start_at | timestamptz | |
| end_at | timestamptz | |
| reason | text | opcional |
| created_at | timestamptz | |

**Semântica:** `professional_id NULL` = feriado/fechamento do tenant inteiro. Preenchido = bloqueio individual de profissional.

### Índices

```sql
CREATE INDEX ON bookings(tenant_id, starts_at);
CREATE INDEX ON bookings(tenant_id, professional_id, starts_at);
CREATE INDEX ON bookings(tenant_id, status);
CREATE INDEX ON customers(tenant_id, phone);
CREATE INDEX ON booking_tokens(token);
CREATE INDEX ON professionals(tenant_id, is_active);
CREATE INDEX ON schedule_blocks(tenant_id, start_at);
CREATE INDEX ON services(tenant_id, is_active);
CREATE INDEX ON tenants(slug);
CREATE INDEX ON tenants(status);
```

---

## 5. Estratégia Multi-tenant

### Resolução de Tenant

```typescript
// middleware.ts — Edge Runtime
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''

  // Super Admin
  if (host === 'admin.beautly.com') return handleSuperAdmin(req)

  // Extrai slug
  let slug: string
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    slug = process.env.DEV_TENANT_SLUG ?? 'demo'
  } else if (host.includes('vercel.app')) {
    slug = process.env.PREVIEW_TENANT_SLUG ?? 'demo'
  } else {
    slug = host.split('.')[0] // 'clinica' de 'clinica.beautly.com'
  }

  const res = NextResponse.next()
  res.headers.set('x-tenant-slug', slug)
  return res
}
```

### Resolução Slug → Tenant (com cache)

```typescript
// lib/tenant.ts
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'

export const getTenantBySlug = unstable_cache(
  async (slug: string) => {
    const { data } = await supabaseServer()
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()
    return data
  },
  ['tenant-by-slug'],
  { revalidate: 60 } // 60s de cache
)

export async function getCurrentTenant() {
  const slug = headers().get('x-tenant-slug')
  if (!slug) return null
  return getTenantBySlug(slug)
}
```

### Isolamento em Queries

**Regra:** toda query de aplicação inclui `tenant_id` explicitamente.

```typescript
// domain/bookings/queries.ts
export async function getBookingsByDate(tenantId: string, date: Date) {
  return supabaseServer()
    .from('bookings')
    .select('*, customer:customers(*), service:services(*), professional:professionals(*)')
    .eq('tenant_id', tenantId) // SEMPRE obrigatório
    .gte('starts_at', startOfDay(date).toISOString())
    .lte('starts_at', endOfDay(date).toISOString())
    .order('starts_at')
}
```

### Row Level Security

```sql
-- Aplicado em todas as tabelas de tenant
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON bookings
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## 6. Autenticação e Segurança

### Super Admin

- Credencial única em `.env`: `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD_HASH` (bcrypt)
- Login via `POST /api/super/auth` → gera JWT com claim `role: "super"`
- Cookie: `httpOnly`, `secure`, `sameSite=strict`, 8h de duração
- Sem Supabase Auth — zero dependência externa

### Tenant Admin

- Supabase Auth: `signInWithPassword()`
- Sessão via cookie Supabase (gerenciado automaticamente)
- Middleware verifica sessão + valida `tenant_users.tenant_id` === tenant do host
- Tenant A não acessa painel do Tenant B

### Cliente Final — Link Único Seguro

**Geração:**
```typescript
// lib/tokens.ts
import { randomBytes } from 'crypto'

export function generateBookingToken(): string {
  return randomBytes(32).toString('hex') // 256 bits de entropia
}

export async function createBookingToken(bookingId: string, tenantId: string) {
  const token = generateBookingToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

  await supabaseServer().from('booking_tokens').insert({
    booking_id: bookingId,
    tenant_id: tenantId,
    token,
    expires_at: expiresAt.toISOString(),
  })

  return token
}
```

**Validação:**
```typescript
export async function validateBookingToken(token: string) {
  const { data } = await supabaseServer()
    .from('booking_tokens')
    .select('*, booking:bookings(*)')
    .eq('token', token)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  return data // null se inválido/expirado/revogado
}
```

**Fluxo completo:**
1. Cliente agenda → `booking_tokens` criado → URL: `nome.beautly.com/b/{token}`
2. Meta Cloud API envia o link via WhatsApp
3. Cookie httpOnly salva o token (7 dias) para conveniência no mesmo dispositivo
4. Cancelamento: `status = 'cancelled'` + `revoked_at = now()`
5. Reagendamento: novo booking + novo token + revoga token anterior

### Práticas de Segurança (MVP)

**Implementar desde o início:**

- RLS em todas as tabelas com `tenant_id`
- HTTPS obrigatório (Vercel cuida automaticamente)
- Cookies: `httpOnly`, `secure`, `sameSite=lax`
- Rate limiting: 10 req/min por IP em `/api/bookings` e qualquer endpoint que receba `phone`
- Validação/sanitização com Zod em todas as bordas (form + Server Action)
- Headers de segurança via `next.config.js`:
  ```js
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ]
  ```
- Variáveis sensíveis apenas em `.env` — nunca commitadas
- `phone` nunca retornado em responses públicas
- Nenhum endpoint público aceita phone como parâmetro de busca

---

## 7. Acessibilidade

O projeto será usado como portfólio — acessibilidade é requisito, não opcional.

**Padrão mínimo:** WCAG 2.1 Nível AA

### Práticas obrigatórias

| Área | Requisito |
|---|---|
| HTML semântico | `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, landmarks corretos |
| Formulários | Todo `<input>` com `<label>` associado ou `aria-label` |
| Imagens | `alt` descritivo em todas as imagens; decorativas com `alt=""` |
| Contraste | Mínimo 4.5:1 para texto normal, 3:1 para texto grande (validar cor primária do tenant) |
| Foco | Outline visível em todos os elementos interativos; nunca `outline: none` sem substituto |
| Teclado | Toda interação acessível via teclado; sem armadilhas de foco |
| Motion | Respeitar `prefers-reduced-motion` em animações |
| ARIA | Usar apenas quando HTML semântico for insuficiente; nunca role redundante |
| Erros | Mensagens de erro associadas ao campo via `aria-describedby` |
| Headings | Hierarquia correta (h1 → h2 → h3), não pular níveis |

### shadcn/ui e acessibilidade

shadcn/ui é construído sobre Radix UI que já implementa padrões WAI-ARIA corretamente (dialogs, dropdowns, calendário). Não sobreescrever comportamento de foco ou ARIA dos componentes Radix sem necessidade.

### Mobile e responsividade

- Área de toque mínima: 44×44px (Apple HIG / WCAG 2.5.5)
- Viewport: `meta name="viewport" content="width=device-width, initial-scale=1"`
- Fonte mínima: 16px para inputs (evita zoom automático no iOS)
- Fluxo de booking testado em dispositivos reais (iPhone + Android)

---

## 8. Estrutura de Pastas

```
beautly/
├── app/
│   ├── (super-admin)/
│   │   ├── login/page.tsx
│   │   └── dashboard/
│   │       ├── page.tsx              # visão geral + MRR
│   │       ├── tenants/page.tsx
│   │       └── tenants/[id]/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                # valida auth tenant
│   │   ├── login/page.tsx
│   │   └── dashboard/
│   │       ├── page.tsx              # agenda do dia
│   │       ├── services/page.tsx
│   │       ├── professionals/page.tsx
│   │       ├── schedule/page.tsx
│   │       └── settings/page.tsx
│   ├── (booking)/
│   │   ├── page.tsx                  # página da estética
│   │   ├── book/
│   │   │   ├── page.tsx              # seleção de serviço
│   │   │   ├── [serviceId]/page.tsx  # calendário
│   │   │   └── confirm/page.tsx
│   │   └── b/[token]/page.tsx        # meu agendamento
│   ├── api/
│   │   ├── bookings/route.ts
│   │   ├── bookings/[token]/route.ts
│   │   ├── availability/route.ts
│   │   ├── super/auth/route.ts
│   │   └── admin/auth/route.ts
│   ├── layout.tsx
│   └── not-found.tsx
├── domain/
│   ├── bookings/
│   │   ├── actions.ts                # Server Actions
│   │   ├── queries.ts
│   │   └── types.ts
│   ├── services/
│   ├── professionals/
│   ├── tenants/
│   └── schedule/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── tenant.ts
│   ├── tokens.ts
│   ├── availability.ts
│   └── whatsapp.ts
├── components/
│   ├── ui/                           # shadcn/ui (gerado)
│   ├── booking/
│   ├── admin/
│   └── shared/
├── hooks/
├── types/
├── validations/
├── middleware.ts
└── supabase/
    └── migrations/
```

---

## 9. Estratégia de Branches e Commits

### GitFlow Simplificado

```
main          → produção (beautly.com)
develop       → staging (staging.beautly.com)
feature/*     → novas funcionalidades (preview Vercel)
hotfix/*      → correções urgentes em produção
release/*     → preparação de release (opcional no MVP)
```

**Fluxo padrão:**
```
feature/booking-flow → develop (PR) → release/v1.x → main (PR) → tag v1.x
```

**Fluxo hotfix:**
```
hotfix/fix-token-expiry → main (PR) → cherry-pick → develop
```

**Regras:**
- `main` e `develop` têm branch protection — nunca push direto
- PRs exigem pelo menos 1 review (auto-review no solo via checklist)
- Deploy automático: `develop` → staging, `main` → production

### Conventional Commits

Formato: `type(scope): description`

| Type | Quando usar |
|---|---|
| `feat` | nova funcionalidade |
| `fix` | correção de bug |
| `chore` | config, deps, build |
| `docs` | documentação |
| `style` | formatação (sem mudança de lógica) |
| `refactor` | refatoração sem feat/fix |
| `test` | testes |
| `perf` | melhoria de performance |
| `ci` | pipelines CI/CD |

**Exemplos:**
```
feat(booking): add availability slot generation logic
fix(tokens): handle expired token redirect correctly
feat(admin): add professional management CRUD
chore(deps): upgrade next to 15.2.0
ci: add preview deployment workflow
feat(a11y): add aria-labels to booking form inputs
```

**Scopes recomendados:** `booking`, `admin`, `super-admin`, `auth`, `tokens`, `whatsapp`, `availability`, `tenant`, `a11y`, `db`, `ci`, `deps`

---

## 10. Environments e Deploy

### Mapeamento

| Branch | Environment | URL | Supabase |
|---|---|---|---|
| `main` | production | `*.beautly.com` | projeto `beautly-prod` |
| `develop` | staging | `staging.beautly.com` | projeto `beautly-staging` |
| `feature/*` | preview | `beautly-git-*.vercel.app` | projeto `beautly-staging` |
| `hotfix/*` | preview | `beautly-git-*.vercel.app` | projeto `beautly-staging` |

### Supabase

- **2 projetos separados:** `beautly-prod` e `beautly-staging`
- Migrations gerenciadas via `supabase/migrations/` + Supabase CLI
- `supabase db push` no CI antes do deploy
- Staging tem dados de seed (tenant `demo` + serviços exemplo)

### Variáveis de Ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only

# Super Admin
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD_HASH=          # bcrypt hash

# JWT
JWT_SECRET=                         # super admin JWT

# Meta Cloud API (WhatsApp)
META_WHATSAPP_TOKEN=
META_WHATSAPP_PHONE_ID=
META_WHATSAPP_TEMPLATE_CONFIRMATION=

# Tenant dev/preview
DEV_TENANT_SLUG=demo
PREVIEW_TENANT_SLUG=demo

# App
NEXT_PUBLIC_APP_DOMAIN=beautly.com
MONTHLY_PRICE_DEFAULT=              # valor padrão ao criar tenant no MVP
```

### GitHub Actions (CI)

```yaml
# .github/workflows/ci.yml
- TypeScript check (tsc --noEmit)
- Lint (ESLint)
- Build check
- Supabase migration check (develop/main only)
```

---

## 11. Roadmap Técnico

### Fase 1 — MVP Funcional

**Infraestrutura:**
- Projeto Next.js + Supabase + Vercel configurados
- Middleware multi-tenant
- RLS em todas as tabelas
- CI básico (GitHub Actions)

**Core Booking:**
- Página pública da estética (branding do tenant)
- Listagem de serviços
- Calendário de disponibilidade (slots por duração + buffer)
- Formulário nome + telefone
- Criação de agendamento + geração de token
- Página `/b/[token]` (ver, cancelar, reagendar)
- Confirmação via WhatsApp (Meta Cloud API)

**Admin Tenant:**
- Auth (Supabase Auth)
- Dashboard: agenda do dia
- CRUD serviços
- CRUD profissionais (1 padrão criado no onboarding)
- Horários de funcionamento + bloqueios
- Configurações: nome, logo, cor

**Super Admin:**
- Login seguro
- Painel: tenants ativos, MRR, lista de clientes

### Fase 2 — Operacional

- Lembretes automáticos WhatsApp (24h antes)
- OTP por WhatsApp (login cliente)
- Notificação ao admin em novo agendamento
- Relatório básico de agendamentos
- Histórico por cliente no admin
- Horários individuais por profissional
- Onboarding guiado para novo tenant
- Domínio customizado por tenant
- Rate limiting global (Upstash Redis)
- Monitoramento de erros (Sentry)

### Fase 3 — Premium

- Stripe: assinaturas SaaS + cobrança automática
- Pagamento antecipado de serviços
- Pacotes de serviços
- Lista de espera automática
- Avaliação pós-atendimento
- Planos diferenciados com feature flags
- API pública para integrações
- App mobile (PWA ou React Native)

---

## 12. Suposições Assumidas no MVP

1. **Profissionais compartilham horário do tenant** — sem agenda individual por profissional no MVP
2. **Atribuição automática de profissional** — quando tenant tem 1 profissional, seleção é transparente ao cliente; com múltiplos, o cliente escolhe na tela de booking
3. **Sem pagamento online** — `monthly_price` em `tenants` é só para cálculo do MRR no super admin
4. **Templates WhatsApp pré-aprovados** — necessário configurar templates na Meta Business antes de ir a produção
5. **1 admin por tenant no MVP** — `tenant_users` suporta múltiplos, mas onboarding cria apenas 1
6. **Fuso horário** — datas armazenadas em UTC, exibidas no fuso do navegador do cliente; sem configuração de fuso por tenant no MVP
7. **Sem paginação inicial** — listas de agendamentos e serviços sem paginação no MVP (implementar quando necessário)

---

## 13. Dependências Principais

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "typescript": "^5",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0",
    "tailwindcss": "^4",
    "zod": "^3",
    "date-fns": "^3",
    "jose": "^5",
    "bcryptjs": "^2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2",
    "eslint": "^9",
    "prettier": "^3",
    "supabase": "^2"
  }
}
```

**shadcn/ui components necessários no MVP:** Button, Input, Label, Calendar, Select, Dialog, Form, Sonner (toast), Avatar, Badge, Card, Separator, Skeleton

---

## 14. Estratégia de Mocks para Desenvolvimento Local

### Princípio

Trabalho local não deve depender de serviços externos reais (WhatsApp, Supabase produção). O ambiente de dev roda com dados seed e integrações mockadas.

### Seed Data

Arquivo `supabase/seed.sql` populado automaticamente no `supabase start`:

```sql
-- Tenant demo
INSERT INTO tenants (slug, name, primary_color, monthly_price, status)
VALUES ('demo', 'Studio Demo', '#ec4899', 99.90, 'active');

-- Professional padrão
INSERT INTO professionals (tenant_id, name, is_active)
VALUES (<demo_id>, 'Ana Silva', true);

-- Serviços de exemplo
INSERT INTO services (tenant_id, name, price, duration_minutes, buffer_minutes)
VALUES
  (<demo_id>, 'Manicure', 45.00, 45, 15),
  (<demo_id>, 'Pedicure', 55.00, 60, 15),
  (<demo_id>, 'Design de Sobrancelha', 60.00, 30, 10),
  (<demo_id>, 'Limpeza de Pele', 120.00, 90, 15);

-- Horários de funcionamento (seg-sáb)
INSERT INTO business_hours (tenant_id, day_of_week, is_open, open_time, close_time)
VALUES
  (<demo_id>, 1, true, '09:00', '19:00'), -- seg
  (<demo_id>, 2, true, '09:00', '19:00'),
  (<demo_id>, 3, true, '09:00', '19:00'),
  (<demo_id>, 4, true, '09:00', '19:00'),
  (<demo_id>, 5, true, '09:00', '18:00'),
  (<demo_id>, 6, true, '09:00', '14:00'), -- sáb
  (<demo_id>, 0, false, null, null);      -- dom fechado
```

### Mocks de Integrações Externas

**Padrão:** cada integração tem uma interface + implementação real + implementação mock.

```typescript
// lib/whatsapp.ts
interface WhatsAppProvider {
  sendBookingConfirmation(phone: string, bookingUrl: string, tenantName: string): Promise<void>
}

// Em produção: usa Meta Cloud API
// Em dev/test: loga no console + salva em arquivo local

export function getWhatsAppProvider(): WhatsAppProvider {
  if (process.env.NODE_ENV === 'development' || process.env.WHATSAPP_MOCK === 'true') {
    return {
      async sendBookingConfirmation(phone, bookingUrl, tenantName) {
        console.log(`[WhatsApp MOCK] Para: ${phone}`)
        console.log(`[WhatsApp MOCK] Tenant: ${tenantName}`)
        console.log(`[WhatsApp MOCK] Link: ${bookingUrl}`)
        // Opcional: salva em .mock-messages.json para inspecionar no dev
      }
    }
  }
  return new MetaCloudWhatsAppProvider()
}
```

### Variáveis de Ambiente Locais (`.env.local`)

```bash
# Supabase local (supabase start)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<gerado pelo supabase start>
SUPABASE_SERVICE_ROLE_KEY=<gerado pelo supabase start>

# Tenant de dev
DEV_TENANT_SLUG=demo

# Mock de integrações
WHATSAPP_MOCK=true

# Super admin local
SUPER_ADMIN_EMAIL=admin@beautly.local
SUPER_ADMIN_PASSWORD_HASH=<bcrypt de "admin123">
JWT_SECRET=dev-secret-not-for-production
```

### Comandos de Desenvolvimento

```bash
# Iniciar Supabase local (Docker)
npx supabase start

# Aplicar migrations + seed
npx supabase db reset

# Rodar aplicação apontando para localhost:54321
npm run dev

# Gerar nova migration após mudança no schema
npx supabase db diff -f nome_da_migration
```

### `.env.local` no `.gitignore`

Nunca commitar `.env.local`. Manter `.env.example` atualizado com todas as variáveis necessárias (sem valores reais) para onboarding de novos devs.
