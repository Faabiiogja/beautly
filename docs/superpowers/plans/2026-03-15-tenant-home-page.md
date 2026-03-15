# Tenant Home Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the consumer-facing home page for `{slug}.beautly.cloud`, showing studio hero + active services list, replacing the current behavior that incorrectly renders the marketing landing page for tenant subdomains.

**Architecture:** `app/page.tsx` reads the `x-context` header (injected by middleware) and routes to either `TenantHomePage` (Server Component that fetches tenant + services data) or `BeautlyLandingPage`. A new `getServicesByTenantId` cached function and `Service` type are added to `lib/tenant.ts`. All tenant UI components live in `components/tenant/` and import `Service` from `lib/tenant`.

**Tech Stack:** Next.js 15 App Router, React 19 Server Components, Supabase service role client, Tailwind CSS, Vitest + React Testing Library

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/tenant.ts` | Modify | Add `Service` type + `getServicesByTenantId` cached function |
| `components/tenant/service-card.tsx` | Create | Renders one service: name, price (R$), duration (min) |
| `components/tenant/hero-section.tsx` | Create | Studio name, logo/gradient, CTA button |
| `components/tenant/services-section.tsx` | Create | Services grid with header and empty state |
| `components/tenant/home-page.tsx` | Create | Async Server Component: fetches data, composes layout |
| `app/page.tsx` | Modify | Add context detection → render tenant or marketing page |
| `__tests__/lib/tenant.test.ts` | Modify | Add tests for `getServicesByTenantId` |
| `__tests__/components/tenant/service-card.test.tsx` | Create | Price + duration formatting tests |
| `__tests__/components/tenant/home-page.test.tsx` | Create | Rendering + notFound + empty state tests |
| `__tests__/app/page.test.tsx` | Create | Context-based routing tests |

---

## Chunk 1: Data Layer

### Task 1: Add `Service` type + `getServicesByTenantId` to `lib/tenant.ts`

**Files:**
- Modify: `lib/tenant.ts`
- Modify: `__tests__/lib/tenant.test.ts`

**Context:**
- `lib/tenant.ts` already imports `unstable_cache`, `createSupabaseServiceClient`, and `Database` at the top. The `Tenant` type is defined as `type Tenant = Database['public']['Tables']['tenants']['Row']`. Follow this same pattern for `Service`.
- `__tests__/lib/tenant.test.ts` already has `import { describe, it, expect } from 'vitest'` on line 1. **Do NOT add duplicate imports.** Merge `vi` and `beforeEach` into the existing import line, and add the `createSupabaseServiceClient` import after the existing imports at the top.
- The `services` table columns: `id` (uuid), `name` (text), `price` (number), `duration_minutes` (number), `tenant_id` (uuid), `is_active` (boolean). Use `is_active`, NOT `active`.

- [ ] **Step 1: Edit the imports in `__tests__/lib/tenant.test.ts`**

The file currently starts with:
```typescript
import { describe, it, expect } from 'vitest'
import { extractTenantSlug } from '@/lib/tenant'
```

Change it to:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractTenantSlug } from '@/lib/tenant'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: Function) => fn,
}))
```

Note: `vi.mock` calls are hoisted to the top by Vitest automatically — existing tests for `extractTenantSlug` will not be affected because they don't call Supabase.

- [ ] **Step 2: Add the `getServicesByTenantId` test suite at the end of `__tests__/lib/tenant.test.ts`**

```typescript
describe('getServicesByTenantId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna serviços ativos do tenant ordenados por nome', async () => {
    const mockServices = [
      { id: '1', name: 'Corte', price: 50, duration_minutes: 30 },
      { id: '2', name: 'Manicure', price: 30, duration_minutes: 45 },
    ]
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockServices, error: null }),
    }
    vi.mocked(createSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue(mockQuery),
    } as any)

    const { getServicesByTenantId } = await import('@/lib/tenant')
    const result = await getServicesByTenantId('tenant-123')

    expect(result).toEqual(mockServices)
    expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'tenant-123')
    expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true)
    expect(mockQuery.order).toHaveBeenCalledWith('name')
  })

  it('retorna array vazio quando não há serviços', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(createSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue(mockQuery),
    } as any)

    const { getServicesByTenantId } = await import('@/lib/tenant')
    const result = await getServicesByTenantId('tenant-123')

    expect(result).toEqual([])
  })
})
```

- [ ] **Step 3: Run tests to verify the new tests fail**

```bash
npx vitest run __tests__/lib/tenant.test.ts
```

Expected: FAIL — `getServicesByTenantId` is not exported from `@/lib/tenant`

- [ ] **Step 4: Add `Service` type and `getServicesByTenantId` to `lib/tenant.ts`**

Append after the `getCurrentTenant` function at the end of the file:

```typescript
// Service type derived from database schema — single source of truth
export type Service = Pick<
  Database['public']['Tables']['services']['Row'],
  'id' | 'name' | 'price' | 'duration_minutes'
>

/**
 * Busca serviços ativos de um tenant com cache de 60 segundos.
 * O Next.js incorpora os argumentos da função na chave de cache automaticamente,
 * então tenants diferentes têm entradas de cache separadas.
 */
export const getServicesByTenantId = unstable_cache(
  async (tenantId: string): Promise<Service[]> => {
    const supabase = createSupabaseServiceClient()
    const { data } = await supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name')
    return (data ?? []) as Service[]
  },
  ['services-by-tenant'],
  { revalidate: 60 }
)
```

- [ ] **Step 5: Run tests to verify they all pass**

```bash
npx vitest run __tests__/lib/tenant.test.ts
```

Expected: All tests pass — existing `extractTenantSlug` suites AND new `getServicesByTenantId` suite.

- [ ] **Step 6: Commit**

```bash
git add lib/tenant.ts __tests__/lib/tenant.test.ts
git commit -m "feat(tenant): add Service type and getServicesByTenantId cached function"
```

---

## Chunk 2: UI Leaf Components

### Task 2: Create `ServiceCard` component

**Files:**
- Create: `components/tenant/service-card.tsx`
- Create: `__tests__/components/tenant/service-card.test.tsx`

**Context:** Pure presentational component — no async, no data fetching. Imports `Service` from `@/lib/tenant`. The `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` formatter inserts a non-breaking space (`\u00a0`) between "R$" and the number — tests use this character explicitly.

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/tenant/service-card.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ServiceCard } from '@/components/tenant/service-card'

describe('ServiceCard', () => {
  const service = {
    id: '1',
    name: 'Corte Feminino',
    price: 80,
    duration_minutes: 60,
  }

  it('exibe o nome do serviço', () => {
    render(<ServiceCard service={service} />)
    expect(screen.getByText('Corte Feminino')).toBeInTheDocument()
  })

  it('formata o preço como R$ com vírgula decimal', () => {
    render(<ServiceCard service={service} />)
    expect(screen.getByText('R$\u00a080,00')).toBeInTheDocument()
  })

  it('exibe a duração em minutos', () => {
    render(<ServiceCard service={service} />)
    expect(screen.getByText('60 min')).toBeInTheDocument()
  })

  it('formata preço com centavos corretamente', () => {
    render(<ServiceCard service={{ ...service, price: 99.9 }} />)
    expect(screen.getByText('R$\u00a099,90')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/tenant/service-card.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `components/tenant/service-card.tsx`**

```typescript
// components/tenant/service-card.tsx
import type { Service } from '@/lib/tenant'

type Props = {
  service: Service
}

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function ServiceCard({ service }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
      <span className="text-sm font-semibold text-white">{service.name}</span>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#ec4899]">
          {priceFormatter.format(service.price)}
        </span>
        <span className="text-xs text-white/50">{service.duration_minutes} min</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/tenant/service-card.test.tsx
```

Expected: All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/tenant/service-card.tsx __tests__/components/tenant/service-card.test.tsx
git commit -m "feat(tenant): add ServiceCard component"
```

---

### Task 3: Create `HeroSection` component

**Files:**
- Create: `components/tenant/hero-section.tsx`

**Context:** Pure presentational component. No test file — no logic to test. CTA is `<button type="button">`, not `<a>`. If `logoUrl` is provided it's used as a CSS `background-image` — the URL comes from Supabase storage so it is a well-formed URL, no additional sanitization needed.

- [ ] **Step 1: Create `components/tenant/hero-section.tsx`**

```typescript
// components/tenant/hero-section.tsx

type Props = {
  name: string
  logoUrl: string | null
}

export function HeroSection({ name, logoUrl }: Props) {
  return (
    <section className="relative min-h-[60vh] flex flex-col justify-end md:flex-row md:items-center overflow-hidden bg-[#0a0a0a]">
      {/* Background: image or gradient */}
      {logoUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${logoUrl})` }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a0a14] to-[#ec4899]/30"
          aria-hidden="true"
        />
      )}

      {/* Overlay for text legibility */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 px-6 pb-12 pt-24 md:w-1/2 md:px-12 md:py-20">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#ec4899]">
          Seu salão de beleza
        </p>
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">{name}</h1>
        <p className="mb-8 text-base text-white/70">
          Agende seu horário com facilidade
        </p>
        <button
          type="button"
          title="Em breve"
          className="rounded-xl bg-[#ec4899] px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Agendar agora
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/tenant/hero-section.tsx
git commit -m "feat(tenant): add HeroSection component"
```

---

### Task 4: Create `ServicesSection` component

**Files:**
- Create: `components/tenant/services-section.tsx`

**Context:** Pure presentational component. Imports `Service` from `@/lib/tenant` and `ServiceCard` from `./service-card`.

- [ ] **Step 1: Create `components/tenant/services-section.tsx`**

```typescript
// components/tenant/services-section.tsx
import type { Service } from '@/lib/tenant'
import { ServiceCard } from '@/components/tenant/service-card'

type Props = {
  services: Service[]
}

export function ServicesSection({ services }: Props) {
  return (
    <section className="px-6 py-10 md:px-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Nossos Serviços</h2>
        {services.length > 0 && (
          <span className="text-xs text-[#ec4899] cursor-default">Ver todos</span>
        )}
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-white/50">Em breve</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/tenant/services-section.tsx
git commit -m "feat(tenant): add ServicesSection component"
```

---

## Chunk 3: Server Components & Routing

### Task 5: Create `TenantHomePage` Server Component

**Files:**
- Create: `components/tenant/home-page.tsx`
- Create: `__tests__/components/tenant/home-page.test.tsx`

**Context:** `TenantHomePage` is an **async** React Server Component. It calls `getCurrentTenant()` and `getServicesByTenantId()` from `lib/tenant.ts`. If `getCurrentTenant()` returns null, it calls `notFound()` from `next/navigation`.

In tests, async Server Components are just async functions — call with `await TenantHomePage()` and pass the JSX to `render()`. Mock `next/navigation` so `notFound()` throws a catchable error instead of the special Next.js signal. Mock `@/lib/tenant` module-wide.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/components/tenant/home-page.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/tenant', () => ({
  getCurrentTenant: vi.fn(),
  getServicesByTenantId: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

import * as tenantLib from '@/lib/tenant'
import { TenantHomePage } from '@/components/tenant/home-page'

const mockTenant = {
  id: 'tenant-1',
  name: 'Studio Demo',
  slug: 'demo',
  logo_url: null,
  primary_color: '#ec4899',
  status: 'active',
  created_at: '',
  updated_at: '',
  monthly_price: 0,
  timezone: 'America/Sao_Paulo',
}

const mockServices = [
  { id: 's1', name: 'Corte', price: 50, duration_minutes: 30 },
  { id: 's2', name: 'Manicure', price: 30, duration_minutes: 45 },
]

describe('TenantHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza o nome do studio no hero', async () => {
    vi.mocked(tenantLib.getCurrentTenant).mockResolvedValue(mockTenant)
    vi.mocked(tenantLib.getServicesByTenantId).mockResolvedValue(mockServices)

    render(await TenantHomePage())

    expect(screen.getByRole('heading', { level: 1, name: /Studio Demo/i })).toBeInTheDocument()
  })

  it('renderiza a lista de serviços', async () => {
    vi.mocked(tenantLib.getCurrentTenant).mockResolvedValue(mockTenant)
    vi.mocked(tenantLib.getServicesByTenantId).mockResolvedValue(mockServices)

    render(await TenantHomePage())

    expect(screen.getByText('Corte')).toBeInTheDocument()
    expect(screen.getByText('Manicure')).toBeInTheDocument()
  })

  it('renderiza estado vazio quando não há serviços', async () => {
    vi.mocked(tenantLib.getCurrentTenant).mockResolvedValue(mockTenant)
    vi.mocked(tenantLib.getServicesByTenantId).mockResolvedValue([])

    render(await TenantHomePage())

    expect(screen.getByText('Em breve')).toBeInTheDocument()
  })

  it('chama notFound() quando tenant não existe', async () => {
    vi.mocked(tenantLib.getCurrentTenant).mockResolvedValue(null)

    await expect(TenantHomePage()).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/tenant/home-page.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `components/tenant/home-page.tsx`**

```typescript
// components/tenant/home-page.tsx
import { notFound } from 'next/navigation'
import { getCurrentTenant, getServicesByTenantId } from '@/lib/tenant'
import { HeroSection } from '@/components/tenant/hero-section'
import { ServicesSection } from '@/components/tenant/services-section'

export async function TenantHomePage() {
  const tenant = await getCurrentTenant()
  if (!tenant) notFound()

  const services = await getServicesByTenantId(tenant.id)

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <HeroSection name={tenant.name} logoUrl={tenant.logo_url} />
      <ServicesSection services={services} />
      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} {tenant.name} · Powered by Beautly
      </footer>
    </main>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/tenant/home-page.test.tsx
```

Expected: All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/tenant/home-page.tsx __tests__/components/tenant/home-page.test.tsx
git commit -m "feat(tenant): add TenantHomePage server component"
```

---

### Task 6: Update `app/page.tsx` — context-based routing

**Files:**
- Modify: `app/page.tsx`
- Create: `__tests__/app/page.test.tsx`

**Context:** `app/page.tsx` currently renders only `BeautlyLandingPage`. It needs to become an async Server Component reading the `x-context` header. In tests: mock `next/headers` to return a controlled `get()` function; mock both page components as simple stubs so the test only verifies routing logic, not rendering of the sub-components (which are tested separately).

- [ ] **Step 1: Write the failing tests**

Create `__tests__/app/page.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

vi.mock('@/components/tenant/home-page', () => ({
  TenantHomePage: () => <div data-testid="tenant-home-page" />,
}))

vi.mock('@/app/_components/marketing/landing-page', () => ({
  BeautlyLandingPage: () => <div data-testid="marketing-landing-page" />,
}))

import { headers } from 'next/headers'
import RootPage from '@/app/page'

describe('RootPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza TenantHomePage quando x-context é tenant', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: (key: string) => (key === 'x-context' ? 'tenant' : null),
    } as any)

    render(await RootPage())

    expect(screen.getByTestId('tenant-home-page')).toBeInTheDocument()
    expect(screen.queryByTestId('marketing-landing-page')).not.toBeInTheDocument()
  })

  it('renderiza BeautlyLandingPage quando x-context é marketing', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: (key: string) => (key === 'x-context' ? 'marketing' : null),
    } as any)

    render(await RootPage())

    expect(screen.getByTestId('marketing-landing-page')).toBeInTheDocument()
    expect(screen.queryByTestId('tenant-home-page')).not.toBeInTheDocument()
  })

  it('renderiza BeautlyLandingPage quando x-context é null', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: () => null,
    } as any)

    render(await RootPage())

    expect(screen.getByTestId('marketing-landing-page')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/app/page.test.tsx
```

Expected: FAIL — `RootPage` is not async / does not read headers

- [ ] **Step 3: Replace `app/page.tsx`**

```typescript
// app/page.tsx
import { headers } from 'next/headers'
import { TenantHomePage } from '@/components/tenant/home-page'
import { BeautlyLandingPage } from '@/app/_components/marketing/landing-page'

export default async function RootPage() {
  const headersList = await headers()
  const context = headersList.get('x-context')

  if (context === 'tenant') {
    return <TenantHomePage />
  }
  return <BeautlyLandingPage />
}
```

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass — no regressions in existing suites + all new tests green.

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx __tests__/app/page.test.tsx
git commit -m "feat(routing): render TenantHomePage for tenant context in app/page.tsx"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass with no failures.
