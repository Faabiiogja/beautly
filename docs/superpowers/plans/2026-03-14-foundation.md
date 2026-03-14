# Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap o projeto Beautly com Next.js 15, schema Supabase completo e middleware multi-tenant — entregando um ambiente local funcional com tenant `demo` acessível em `localhost:3000`.

**Architecture:** Next.js 15 App Router monolito. Middleware no Edge extrai o tenant slug do header `host` e o repassa via `x-tenant-slug`. Banco PostgreSQL compartilhado com isolamento por `tenant_id` na aplicação e RLS para operações autenticadas. Supabase CLI gerencia migrations localmente. Vitest para testes de unidade.

**Tech Stack:** Next.js 15, TypeScript 5, Tailwind CSS 4, shadcn/ui, Supabase CLI, Vitest, @supabase/ssr, jose, bcryptjs

---

## Chunk 1: Project Bootstrap

### Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `package.json` | dependências do projeto |
| `tsconfig.json` | configuração TypeScript |
| `next.config.ts` | configuração Next.js + security headers |
| `vitest.config.ts` | configuração de testes |
| `.env.example` | template de variáveis (versionado) |
| `.env.local` | variáveis locais reais (gitignored) |
| `.gitignore` | arquivos ignorados |
| `prettier.config.js` | formatação de código |

---

### Task 1: Scaffold Next.js no diretório existente

**Files:**
- Create: todos os arquivos base do Next.js 15

- [ ] **Step 1: Scaffold o projeto**

```bash
cd /home/fabio/Projetos/Beautly
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --yes
```

Quando perguntar sobre diretório não vazio, responda `y`.

- [ ] **Step 2: Verificar estrutura gerada**

```bash
ls -la
```

Expected: `app/`, `public/`, `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts` (ou integração via CSS no Tailwind v4).

- [ ] **Step 3: Instalar dependências adicionais**

```bash
npm install @supabase/supabase-js @supabase/ssr jose bcryptjs date-fns
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/bcryptjs
```

- [ ] **Step 4: Verificar instalação**

```bash
npm run build
```

Expected: build sem erros.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold next.js 15 project with base dependencies"
```

---

### Task 2: Configurar Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Criar vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 2: Criar vitest.setup.ts**

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Adicionar script de test ao package.json**

Em `package.json`, adicionar dentro de `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Verificar que vitest roda**

```bash
npm test -- --run
```

Expected: "No test files found" (nenhum teste ainda, mas sem erro de config).

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json
git commit -m "chore: add vitest configuration"
```

---

### Task 3: Configurar Prettier e ESLint

**Files:**
- Create: `prettier.config.js`
- Modify: `.eslintrc.json` (ou `eslint.config.mjs`)

- [ ] **Step 1: Criar prettier.config.js**

```javascript
// prettier.config.js
/** @type {import('prettier').Config} */
module.exports = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
}
```

- [ ] **Step 2: Instalar plugin Prettier**

```bash
npm install -D prettier prettier-plugin-tailwindcss
```

- [ ] **Step 3: Adicionar script ao package.json**

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 4: Commit**

```bash
git add prettier.config.js package.json
git commit -m "chore: add prettier configuration"
```

---

### Task 4: Configurar Next.js com security headers

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Substituir next.config.ts**

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Expected: build sem erros.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore(config): add security headers and image domain config"
```

---

### Task 5: Configurar variáveis de ambiente

**Files:**
- Create: `.env.example`
- Create: `.env.local`

- [ ] **Step 1: Criar .env.example (versionado)**

```bash
# .env.example
# ============================================================
# Supabase — obtidos em https://supabase.com/dashboard
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ============================================================
# Super Admin (Beautly platform owner)
# Gerar hash: node -e "const b=require('bcryptjs');console.log(b.hashSync('sua-senha',10))"
# ============================================================
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD_HASH=
JWT_SECRET=

# ============================================================
# WhatsApp — Meta Cloud API
# ============================================================
META_WHATSAPP_TOKEN=
META_WHATSAPP_PHONE_ID=
META_WHATSAPP_TEMPLATE_CONFIRMATION=booking_confirmation

# ============================================================
# Controles de ambiente
# ============================================================
NEXT_PUBLIC_APP_DOMAIN=beautly.com
MONTHLY_PRICE_DEFAULT=99.90
DEV_TENANT_SLUG=demo
PREVIEW_TENANT_SLUG=demo
WHATSAPP_MOCK=false
```

- [ ] **Step 2: Criar .env.local com valores de desenvolvimento**

```bash
# .env.local
# Supabase local — rodando via `supabase start`
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRFA0NiK7kyqHnz4F-TA4OoSJwEm_tBcfFnoRCPTPUc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hj04zWl196z2-SBc0

SUPER_ADMIN_EMAIL=admin@beautly.local
# hash de "admin123" — use apenas em desenvolvimento
SUPER_ADMIN_PASSWORD_HASH=$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
JWT_SECRET=dev-only-secret-never-use-in-production

NEXT_PUBLIC_APP_DOMAIN=localhost:3000
MONTHLY_PRICE_DEFAULT=99.90
DEV_TENANT_SLUG=demo
PREVIEW_TENANT_SLUG=demo
WHATSAPP_MOCK=true
```

> **Nota:** as chaves anon/service_role acima são as chaves padrão do Supabase local. Após rodar `supabase start`, confirme os valores reais com `supabase status`.

- [ ] **Step 3: Verificar .gitignore inclui .env.local**

Abrir `.gitignore` e confirmar que `.env.local` está na lista. Se não estiver:

```bash
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore
```

- [ ] **Step 4: Commit**

```bash
git add .env.example .gitignore
# NÃO adicionar .env.local
git commit -m "chore: add environment variable templates"
```

---

### Task 6: Configurar Git branches (GitFlow simplificado)

- [ ] **Step 1: Renomear branch para main (se necessário)**

```bash
git branch -M main
```

- [ ] **Step 2: Criar branch develop**

```bash
git checkout -b develop
git push -u origin develop  # após configurar remote no GitHub
```

> **Nota:** o remote GitHub será configurado quando o repositório for criado. Por enquanto, trabalhar em `develop` localmente.

- [ ] **Step 3: Criar branch da feature atual**

```bash
git checkout -b feature/foundation
```

- [ ] **Step 4: Commit da configuração de branches**

```bash
git add .
git commit -m "chore: initialize gitflow branch structure"
```

---

### Task 7: Instalar shadcn/ui

**Files:**
- Create: `components/ui/` (gerado pelo shadcn CLI)
- Create: `lib/utils.ts` (gerado pelo shadcn CLI)

- [ ] **Step 1: Inicializar shadcn/ui**

```bash
npx shadcn@latest init
```

Responder:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

- [ ] **Step 2: Instalar componentes necessários para o MVP**

```bash
npx shadcn@latest add button input label card badge separator skeleton sonner dialog select form calendar
```

- [ ] **Step 3: Verificar que componentes foram criados**

```bash
ls components/ui/
```

Expected: arquivos `.tsx` para cada componente adicionado.

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Expected: build sem erros.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add shadcn/ui with base components"
```

---

## Chunk 2: Database Schema

### Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/config.toml` | configuração Supabase CLI local |
| `supabase/migrations/20260314000001_initial_schema.sql` | CREATE TABLE de todas as tabelas |
| `supabase/migrations/20260314000002_rls_policies.sql` | RLS policies |
| `supabase/migrations/20260314000003_indexes.sql` | índices + constraints |
| `supabase/seed.sql` | dados de desenvolvimento |
| `types/database.ts` | tipos TypeScript gerados do schema |

---

### Task 8: Inicializar Supabase CLI

**Files:**
- Create: `supabase/config.toml` (gerado)

- [ ] **Step 1: Instalar Supabase CLI (se não instalado)**

```bash
npm install -D supabase
```

- [ ] **Step 2: Inicializar Supabase no projeto**

```bash
npx supabase init
```

Expected: cria pasta `supabase/` com `config.toml`.

- [ ] **Step 3: Iniciar Supabase local (requer Docker)**

```bash
npx supabase start
```

Expected após ~60s:
```
Started supabase local development setup.
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
...
```

Salvar os valores de `anon key` e `service_role key` e atualizar `.env.local` se diferentes dos padrões.

- [ ] **Step 4: Commit**

```bash
git add supabase/config.toml
git commit -m "chore(db): initialize supabase cli"
```

---

### Task 9: Migration 001 — Schema inicial

**Files:**
- Create: `supabase/migrations/20260314000001_initial_schema.sql`

- [ ] **Step 1: Criar arquivo de migration**

```sql
-- supabase/migrations/20260314000001_initial_schema.sql

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  logo_url      text,
  primary_color text NOT NULL DEFAULT '#ec4899',
  timezone      text NOT NULL DEFAULT 'America/Sao_Paulo',
  monthly_price numeric(10,2) NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TENANT USERS (admins vinculados ao Supabase Auth)
-- ============================================================
CREATE TABLE tenant_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'owner'
             CHECK (role IN ('owner', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- ============================================================
-- PROFESSIONALS
-- ============================================================
CREATE TABLE professionals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  bio        text,
  avatar_url text,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE services (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  price            numeric(10,2) NOT NULL DEFAULT 0,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  buffer_minutes   int NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  phone          text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  anonymized_at  timestamptz,
  UNIQUE (tenant_id, phone)
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES customers(id),
  service_id      uuid NOT NULL REFERENCES services(id),
  professional_id uuid NOT NULL REFERENCES professionals(id),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BOOKING TOKENS (links seguros para o cliente)
-- ============================================================
CREATE TABLE booking_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token      text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BUSINESS HOURS (grade semanal do tenant)
-- ============================================================
CREATE TABLE business_hours (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week  int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open      boolean NOT NULL DEFAULT true,
  open_time    time,
  close_time   time,
  UNIQUE (tenant_id, day_of_week),
  CHECK (
    (is_open = false) OR
    (is_open = true AND open_time IS NOT NULL AND close_time IS NOT NULL AND open_time < close_time)
  )
);

-- ============================================================
-- SCHEDULE BLOCKS (exceções / bloqueios)
-- ============================================================
CREATE TABLE schedule_blocks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES professionals(id), -- NULL = bloqueia todos
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

-- ============================================================
-- updated_at automático via trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

- [ ] **Step 2: Aplicar migration**

```bash
npx supabase db reset
```

Expected: "Finished supabase db reset." sem erros.

- [ ] **Step 3: Verificar tabelas no Supabase Studio**

Abrir `http://localhost:54323` → Table Editor → confirmar que todas as tabelas foram criadas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add initial schema migration — all tables"
```

---

### Task 10: Migration 002 — RLS Policies

**Files:**
- Create: `supabase/migrations/20260314000002_rls_policies.sql`

- [ ] **Step 1: Criar migration de RLS**

```sql
-- supabase/migrations/20260314000002_rls_policies.sql

-- ============================================================
-- Ativar RLS em todas as tabelas de tenant
-- ============================================================
ALTER TABLE tenant_users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_tokens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours   ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Políticas para usuários autenticados (tenant admin)
-- Usam auth.uid() — chave anon/user, NÃO service_role
-- ============================================================

-- tenant_users: admin vê apenas seu próprio tenant
CREATE POLICY tu_tenant_isolation ON tenant_users
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- professionals
CREATE POLICY prof_tenant_isolation ON professionals
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- services
CREATE POLICY svc_tenant_isolation ON services
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- customers
CREATE POLICY cust_tenant_isolation ON customers
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- bookings
CREATE POLICY book_tenant_isolation ON bookings
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- booking_tokens (acesso via booking → tenant)
CREATE POLICY bt_tenant_isolation ON booking_tokens
  FOR ALL USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN tenant_users tu ON b.tenant_id = tu.tenant_id
      WHERE tu.user_id = auth.uid()
    )
  );

-- business_hours
CREATE POLICY bh_tenant_isolation ON business_hours
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- schedule_blocks
CREATE POLICY sb_tenant_isolation ON schedule_blocks
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- NOTA: O fluxo público de booking e o super admin usam
-- service_role key — RLS é bypassado intencionalmente.
-- O isolamento nesse caso é garantido pelo tenant_id
-- explícito em todas as queries da aplicação.
-- Nunca expor a service_role key no client-side.
-- ============================================================
```

- [ ] **Step 2: Aplicar migration**

```bash
npx supabase db reset
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260314000002_rls_policies.sql
git commit -m "feat(db): add rls policies for tenant isolation"
```

---

### Task 11: Migration 003 — Índices e constraints

**Files:**
- Create: `supabase/migrations/20260314000003_indexes.sql`

- [ ] **Step 1: Criar migration de índices**

```sql
-- supabase/migrations/20260314000003_indexes.sql

-- Performance: agenda do dia (query mais frequente)
CREATE INDEX idx_bookings_tenant_date
  ON bookings(tenant_id, starts_at);

-- Performance: agenda por profissional
CREATE INDEX idx_bookings_professional_date
  ON bookings(tenant_id, professional_id, starts_at);

-- Performance: filtro por status
CREATE INDEX idx_bookings_tenant_status
  ON bookings(tenant_id, status);

-- Performance: lookup de cliente por telefone
CREATE INDEX idx_customers_phone
  ON customers(tenant_id, phone);

-- Performance crítica: validação de token (path mais frequente do cliente)
CREATE UNIQUE INDEX idx_booking_tokens_token
  ON booking_tokens(token);

-- Performance: profissionais ativos do tenant
CREATE INDEX idx_professionals_active
  ON professionals(tenant_id, is_active);

-- Performance: bloqueios de agenda por período
CREATE INDEX idx_schedule_blocks_period
  ON schedule_blocks(tenant_id, start_at, end_at);

-- Performance: serviços ativos do tenant
CREATE INDEX idx_services_active
  ON services(tenant_id, is_active);

-- Performance crítica: resolução de tenant por slug
CREATE INDEX idx_tenants_slug
  ON tenants(slug);

-- Performance: filtro de tenants ativos (super admin)
CREATE INDEX idx_tenants_status
  ON tenants(status);

-- ============================================================
-- CONSTRAINT: previne double-booking
-- Dois agendamentos confirmados no mesmo horário para o
-- mesmo profissional são rejeitados pelo banco.
-- ============================================================
CREATE UNIQUE INDEX idx_no_double_booking
  ON bookings(professional_id, starts_at)
  WHERE status NOT IN ('cancelled', 'rescheduled');
```

- [ ] **Step 2: Aplicar migration**

```bash
npx supabase db reset
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260314000003_indexes.sql
git commit -m "feat(db): add indexes and double-booking constraint"
```

---

### Task 12: Seed data

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Criar seed.sql**

```sql
-- supabase/seed.sql
-- Dados de desenvolvimento — carregados via `supabase db reset`

DO $$
DECLARE
  demo_tenant_id uuid := gen_random_uuid();
  demo_professional_id uuid := gen_random_uuid();
BEGIN

-- ============================================================
-- Tenant demo
-- ============================================================
INSERT INTO tenants (id, slug, name, primary_color, timezone, monthly_price, status)
VALUES (
  demo_tenant_id,
  'demo',
  'Studio Demo',
  '#ec4899',
  'America/Sao_Paulo',
  99.90,
  'active'
);

-- ============================================================
-- Profissional padrão (criado automaticamente com o tenant)
-- ============================================================
INSERT INTO professionals (id, tenant_id, name, is_active, sort_order)
VALUES (
  demo_professional_id,
  demo_tenant_id,
  'Ana Silva',
  true,
  0
);

-- ============================================================
-- Serviços de exemplo
-- ============================================================
INSERT INTO services (tenant_id, name, description, price, duration_minutes, buffer_minutes, is_active)
VALUES
  (demo_tenant_id, 'Manicure', 'Manicure completa com esmaltação', 45.00, 45, 15, true),
  (demo_tenant_id, 'Pedicure', 'Pedicure completa com esmaltação', 55.00, 60, 15, true),
  (demo_tenant_id, 'Design de Sobrancelha', 'Design e limpeza de sobrancelha', 60.00, 30, 10, true),
  (demo_tenant_id, 'Limpeza de Pele', 'Limpeza profunda de pele', 120.00, 90, 15, true),
  (demo_tenant_id, 'Alongamento de Unhas', 'Alongamento em gel ou fibra', 150.00, 120, 15, false);

-- ============================================================
-- Horários de funcionamento (seg-sáb)
-- ============================================================
INSERT INTO business_hours (tenant_id, day_of_week, is_open, open_time, close_time)
VALUES
  (demo_tenant_id, 0, false, null, null),          -- Domingo: fechado
  (demo_tenant_id, 1, true, '09:00', '19:00'),     -- Segunda
  (demo_tenant_id, 2, true, '09:00', '19:00'),     -- Terça
  (demo_tenant_id, 3, true, '09:00', '19:00'),     -- Quarta
  (demo_tenant_id, 4, true, '09:00', '19:00'),     -- Quinta
  (demo_tenant_id, 5, true, '09:00', '18:00'),     -- Sexta
  (demo_tenant_id, 6, true, '09:00', '14:00');     -- Sábado: meio período

END $$;
```

- [ ] **Step 2: Aplicar seed**

```bash
npx supabase db reset
```

Expected: sem erros. Após o reset, o banco contém o tenant `demo` com serviços e horários.

- [ ] **Step 3: Verificar dados no Studio**

Abrir `http://localhost:54323` → Table Editor → `tenants` → verificar que existe 1 linha com slug `demo`.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat(db): add development seed data with demo tenant"
```

---

### Task 13: Gerar tipos TypeScript do schema

**Files:**
- Create: `types/database.ts`

- [ ] **Step 1: Criar pasta types/**

```bash
mkdir -p types
```

- [ ] **Step 2: Gerar tipos do banco local**

```bash
npx supabase gen types typescript --local > types/database.ts
```

- [ ] **Step 3: Verificar tipos gerados**

```bash
head -50 types/database.ts
```

Expected: arquivo com interfaces TypeScript para cada tabela.

- [ ] **Step 4: Adicionar script ao package.json para regenerar**

```json
"db:types": "supabase gen types typescript --local > types/database.ts"
```

- [ ] **Step 5: Commit**

```bash
git add types/database.ts package.json
git commit -m "feat(db): add generated typescript types from supabase schema"
```

---

## Chunk 3: Multi-tenant Middleware e Lib

### Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `lib/supabase/server.ts` | client Supabase para Server Components / API Routes |
| `lib/supabase/client.ts` | client Supabase para browser (Client Components) |
| `lib/tenant.ts` | `getTenantBySlug()` + `getCurrentTenant()` |
| `middleware.ts` | Edge middleware — extrai tenant slug do host |
| `__tests__/middleware.test.ts` | testes do middleware |
| `__tests__/lib/tenant.test.ts` | testes da resolução de tenant |
| `app/layout.tsx` | root layout com tenant context |
| `app/page.tsx` | página raiz (smoke test page) |
| `.github/workflows/ci.yml` | CI básico |

---

### Task 14: Supabase client helpers

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`

- [ ] **Step 1: Criar lib/supabase/server.ts**

```typescript
// lib/supabase/server.ts
// Client Supabase para uso em Server Components, Server Actions e Route Handlers.
// Usa cookies do @supabase/ssr para manter sessão do tenant admin.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies são read-only nesse contexto
          }
        },
      },
    }
  )
}

// Client com service_role — bypassa RLS.
// Usar em: fluxo público de booking, super admin.
// NUNCA expor no client-side.
export function createSupabaseServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: { persistSession: false },
    }
  )
}
```

- [ ] **Step 2: Criar lib/supabase/client.ts**

```typescript
// lib/supabase/client.ts
// Client Supabase para uso em Client Components (browser).
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Verificar que compila sem erros**

```bash
npx tsc --noEmit
```

Expected: sem erros de tipo.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/
git commit -m "feat(infra): add supabase server and browser client helpers"
```

---

### Task 15: Escrever testes do middleware (TDD)

**Files:**
- Create: `__tests__/middleware.test.ts`

- [ ] **Step 1: Criar arquivo de teste**

```typescript
// __tests__/middleware.test.ts
import { describe, it, expect } from 'vitest'

// Extrai a lógica de resolução do slug para ser testável independentemente.
// O middleware.ts vai importar e usar essa função.
import { extractTenantSlug } from '@/lib/tenant'

describe('extractTenantSlug', () => {
  it('extrai slug de subdomínio em produção', () => {
    expect(extractTenantSlug('clinica.beautly.com')).toBe('clinica')
  })

  it('extrai slug de subdomínio com múltiplos segmentos', () => {
    expect(extractTenantSlug('studio-da-ana.beautly.com')).toBe('studio-da-ana')
  })

  it('retorna fallback para localhost', () => {
    expect(extractTenantSlug('localhost:3000', 'demo')).toBe('demo')
  })

  it('retorna fallback para localhost sem porta', () => {
    expect(extractTenantSlug('localhost', 'demo')).toBe('demo')
  })

  it('retorna fallback para preview Vercel', () => {
    expect(extractTenantSlug('beautly-git-feature-branch.vercel.app', 'demo')).toBe('demo')
  })

  it('retorna null para admin.beautly.com (contexto super admin)', () => {
    expect(extractTenantSlug('admin.beautly.com')).toBeNull()
  })

  it('retorna fallback para 127.0.0.1', () => {
    expect(extractTenantSlug('127.0.0.1:3000', 'demo')).toBe('demo')
  })
})
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```bash
npm test -- --run __tests__/middleware.test.ts
```

Expected: FAIL com "Cannot find module '@/lib/tenant'".

- [ ] **Step 3: Commit do teste**

```bash
git add __tests__/middleware.test.ts
git commit -m "test(middleware): add failing tests for tenant slug extraction"
```

---

### Task 16: Implementar lib/tenant.ts e middleware.ts

**Files:**
- Create: `lib/tenant.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Criar lib/tenant.ts**

```typescript
// lib/tenant.ts
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Tenant = Database['public']['Tables']['tenants']['Row']

/**
 * Extrai o tenant slug do host.
 * Retorna null para admin.beautly.com (super admin context).
 * Retorna o fallback para ambientes de dev/preview.
 */
export function extractTenantSlug(host: string, fallback = 'demo'): string | null {
  // Remove porta se presente
  const hostname = host.split(':')[0]

  // Super admin — sem tenant
  if (hostname === 'admin.beautly.com') return null

  // Dev local
  if (hostname === 'localhost' || hostname === '127.0.0.1') return fallback

  // Preview Vercel
  if (hostname.endsWith('.vercel.app')) return fallback

  // Produção: extrai o primeiro segmento do subdomínio
  const parts = hostname.split('.')
  if (parts.length >= 3) return parts[0]

  return fallback
}

/**
 * Busca tenant por slug com cache de 60 segundos.
 * Usa service_role para leitura pública (sem auth necessária).
 */
export const getTenantBySlug = unstable_cache(
  async (slug: string): Promise<Tenant | null> => {
    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (error || !data) return null
    return data
  },
  ['tenant-by-slug'],
  { revalidate: 60 }
)

/**
 * Obtém o tenant atual a partir do header injetado pelo middleware.
 * Usar em Server Components e Server Actions.
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')
  if (!slug) return null
  return getTenantBySlug(slug)
}
```

- [ ] **Step 2: Rodar testes — devem passar agora**

```bash
npm test -- --run __tests__/middleware.test.ts
```

Expected: PASS em todos os 7 testes.

- [ ] **Step 3: Criar middleware.ts**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { extractTenantSlug } from '@/lib/tenant'

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''

  // Contexto super admin — redirecionar para área protegida
  if (host.split(':')[0] === 'admin.beautly.com') {
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
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 4: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

Expected: sem erros de tipo.

- [ ] **Step 5: Commit**

```bash
git add lib/tenant.ts middleware.ts
git commit -m "feat(tenant): implement tenant slug extraction and edge middleware"
```

---

### Task 17: Escrever testes de lib/tenant (TDD)

**Files:**
- Create: `__tests__/lib/tenant.test.ts`

- [ ] **Step 1: Criar arquivo de teste**

```typescript
// __tests__/lib/tenant.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractTenantSlug } from '@/lib/tenant'

// getTenantBySlug e getCurrentTenant envolvem Supabase e next/cache —
// são testados no nível de integração via supabase db reset + seed.
// Aqui testamos apenas a lógica pura de extração de slug.

describe('extractTenantSlug — casos edge', () => {
  it('lida com host sem porta', () => {
    expect(extractTenantSlug('clinica.beautly.com')).toBe('clinica')
  })

  it('lida com subdomínio composto por hífen', () => {
    expect(extractTenantSlug('studio-beleza.beautly.com')).toBe('studio-beleza')
  })

  it('retorna null explícito para admin.beautly.com', () => {
    expect(extractTenantSlug('admin.beautly.com')).toBeNull()
  })

  it('usa fallback customizado para localhost', () => {
    expect(extractTenantSlug('localhost:3000', 'meu-tenant')).toBe('meu-tenant')
  })

  it('usa fallback padrão "demo" quando não fornecido', () => {
    expect(extractTenantSlug('localhost')).toBe('demo')
  })

  it('usa fallback para qualquer subdomínio .vercel.app', () => {
    expect(extractTenantSlug('beautly-abc123.vercel.app', 'demo')).toBe('demo')
  })

  it('não falha com host vazio', () => {
    expect(extractTenantSlug('', 'demo')).toBe('demo')
  })
})
```

- [ ] **Step 2: Rodar testes**

```bash
npm test -- --run __tests__/lib/tenant.test.ts
```

Expected: PASS. (A função `extractTenantSlug` já foi implementada na Task 16.)

- [ ] **Step 3: Rodar todos os testes**

```bash
npm test -- --run
```

Expected: todos os testes PASS.

- [ ] **Step 4: Commit**

```bash
git add __tests__/
git commit -m "test(tenant): add unit tests for tenant slug extraction edge cases"
```

---

### Task 18: Root layout e smoke test page

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Atualizar app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Beautly',
  description: 'Agendamento para estética feminina',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Criar smoke test page**

```tsx
// app/page.tsx
// Página temporária para smoke test do multi-tenant.
// Será substituída pelo roteamento de booking na feature/booking-flow.
export const dynamic = 'force-dynamic' // usa headers() — nunca estático

import { getCurrentTenant } from '@/lib/tenant'

export default async function RootPage() {
  const tenant = await getCurrentTenant()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">Beautly — Foundation Check</h1>

        {tenant ? (
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Tenant resolvido:</p>
            <p className="font-mono text-sm">{JSON.stringify(tenant, null, 2)}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              Nenhum tenant encontrado. Verifique que o Supabase local está rodando
              e que o DEV_TENANT_SLUG no .env.local aponta para um tenant existente.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Rodar a aplicação e verificar smoke test**

```bash
npm run dev
```

Abrir `http://localhost:3000`. Expected: página mostrando os dados do tenant `demo` (nome, slug, cor, timezone).

- [ ] **Step 4: Verificar build de produção**

```bash
npm run build
```

Expected: build sem erros ou warnings críticos.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat(tenant): add root layout and smoke test page for tenant resolution"
```

---

### Task 19: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Criar diretório e arquivo**

```bash
mkdir -p .github/workflows
```

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  check:
    name: Type check, lint, test, build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test:run

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL_STAGING }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_STAGING }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY_STAGING }}
          JWT_SECRET: ci-test-secret
          SUPER_ADMIN_EMAIL: ci@test.com
          SUPER_ADMIN_PASSWORD_HASH: $2a$10$test
          NEXT_PUBLIC_APP_DOMAIN: beautly.com
          DEV_TENANT_SLUG: demo
          PREVIEW_TENANT_SLUG: demo
          WHATSAPP_MOCK: true
```

- [ ] **Step 2: Adicionar secrets no GitHub** (após push do repositório)

No GitHub → Settings → Secrets → Actions:
- `SUPABASE_URL_STAGING`
- `SUPABASE_ANON_KEY_STAGING`
- `SUPABASE_SERVICE_ROLE_KEY_STAGING`

Por enquanto, o CI irá buildar mas pode falhar na etapa de build por falta dos secrets. Isso será resolvido quando o repositório remoto for configurado.

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add github actions workflow for type check, lint, test and build"
```

---

### Task 20: Final — verificação, merge e push

- [ ] **Step 1: Rodar todos os testes**

```bash
npm test -- --run
```

Expected: PASS em todos.

- [ ] **Step 2: Rodar type check**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 3: Rodar lint**

```bash
npm run lint
```

Expected: sem erros.

- [ ] **Step 4: Build final**

```bash
npm run build
```

Expected: build sem erros.

- [ ] **Step 5: Verificar smoke test no browser**

Com `npm run dev`, abrir `http://localhost:3000` e confirmar que o tenant `demo` aparece na página.

- [ ] **Step 6: Criar repositório no GitHub e fazer push**

```bash
git remote add origin https://github.com/<seu-usuario>/beautly.git
git push -u origin feature/foundation
```

Depois criar PR `feature/foundation` → `develop` no GitHub.

- [ ] **Step 7: Após merge do PR, criar branch para o próximo plano**

```bash
git checkout develop
git pull
git checkout -b feature/super-admin
```

---

## Referência Rápida — Comandos do dia a dia

```bash
# Iniciar ambiente de desenvolvimento
npx supabase start      # inicia PostgreSQL local + Studio
npm run dev             # inicia Next.js em localhost:3000

# Banco de dados
npm run db:types        # regenera tipos TypeScript do schema
npx supabase db reset   # reseta banco + aplica migrations + seed

# Qualidade de código
npm run lint            # ESLint
npm run format          # Prettier
npx tsc --noEmit        # TypeScript check
npm test -- --run       # testes (modo CI)
npm test                # testes (modo watch)

# Supabase Studio
open http://localhost:54323
```
