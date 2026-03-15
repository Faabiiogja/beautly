# Beautly SaaS Landing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer `beautly.vercel.app` renderizar a landing SaaS fixa da Beautly com alta fidelidade ao Stitch, sem quebrar tenant booking ou super-admin.

**Architecture:** Separar explicitamente hosts de marketing dos contextos tenant e super-admin. A resolução de host continua centralizada em `middleware.ts` + `lib/tenant.ts`. A landing da raiz deixa de depender de tenant e passa a ser uma página de marketing fixa em Server Component, com seções React/Tailwind guiadas pela screen do Stitch `Beautly SaaS Landing Page`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS 4, Vitest, Stitch MCP

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `lib/tenant.ts` | Regras de host: marketing vs tenant vs preview |
| `middleware.ts` | Injeção de contexto/slug por host |
| `app/page.tsx` | Landing SaaS da raiz |
| `app/_components/marketing/*` | Seções da landing, se a página precisar de split |
| `app/layout.tsx` | Metadata global, se necessário ajustar descrição/título |
| `app/globals.css` | Tokens visuais globais ou utilidades compartilhadas da landing |
| `__tests__/lib/tenant.test.ts` | Cobertura dos hosts de marketing e preview |
| `__tests__/middleware.test.ts` | Cobertura de regressão da extração de slug |
| `__tests__/app/marketing/landing-page.test.tsx` | Smoke test visual/semântico da landing, caso haja componente extraído |
| `vercel.json` | Alias público, se necessário confirmar/ajustar |

---

## Chunk 1: Host Resolution Safeguards

### Task 1: Cobrir hosts de marketing e preview com testes

**Files:**
- Modify: `__tests__/lib/tenant.test.ts`
- Modify: `__tests__/middleware.test.ts`

- [ ] **Step 1: Adicionar testes de RED para o host público**

Adicionar casos explícitos nos dois arquivos de teste:

```typescript
it('retorna null para beautly.vercel.app (contexto marketing)', () => {
  expect(extractTenantSlug('beautly.vercel.app', 'demo')).toBeNull()
})

it('mantem fallback para preview Vercel que nao e host publico', () => {
  expect(extractTenantSlug('beautly-git-feature-branch.vercel.app', 'demo')).toBe('demo')
})
```

- [ ] **Step 2: Rodar testes alvo e confirmar falha**

Run:
```bash
cd /home/fabio/Projetos/Beautly
npm test -- --run __tests__/lib/tenant.test.ts __tests__/middleware.test.ts
```

Expected: FAIL porque `beautly.vercel.app` ainda retorna `demo`.

- [ ] **Step 3: Implementar regra de marketing em `lib/tenant.ts`**

Introduzir uma lista explícita de hosts de marketing e reutilizá-la em `extractTenantSlug()`:

```typescript
const MARKETING_HOSTS = new Set([
  'beautly.vercel.app',
  'beautly.com',
  'www.beautly.com',
])

export function extractTenantSlug(host: string, fallback = 'demo'): string | null {
  const hostname = host.split(':')[0]

  if (hostname === 'admin.beautly.com') return null
  if (MARKETING_HOSTS.has(hostname)) return null
  if (hostname === 'localhost' || hostname === '127.0.0.1') return fallback
  if (hostname.endsWith('.vercel.app')) return fallback

  const parts = hostname.split('.')
  if (parts.length >= 3) return parts[0]

  return fallback
}
```

- [ ] **Step 4: Ajustar `middleware.ts` para preservar o contexto correto**

Garantir que hosts de marketing não recebam `x-tenant-slug` e não caiam em fallback tenant. O middleware pode continuar usando `extractTenantSlug()`, mas deve respeitar `null` como contexto de marketing.

Trecho esperado:

```typescript
const slug = extractTenantSlug(host, fallback)
const requestHeaders = new Headers(req.headers)

if (slug) {
  requestHeaders.set('x-tenant-slug', slug)
  requestHeaders.set('x-context', 'tenant')
}
```

Se `slug === null`, o response deve seguir sem `x-tenant-slug`.

- [ ] **Step 5: Rodar os testes novamente**

Run:
```bash
cd /home/fabio/Projetos/Beautly
npm test -- --run __tests__/lib/tenant.test.ts __tests__/middleware.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add __tests__/lib/tenant.test.ts __tests__/middleware.test.ts lib/tenant.ts middleware.ts
git commit -m "fix(hosts): reserve public marketing host from tenant fallback"
```

---

## Chunk 2: Stitch-Faithful Marketing Landing

### Task 2: Modelar a landing em componentes React testáveis

**Files:**
- Create: `app/_components/marketing/landing-page.tsx`
- Create: `app/_components/marketing/landing-data.ts`
- Create: `__tests__/app/marketing/landing-page.test.tsx`

- [ ] **Step 1: Antes de codar, inspecionar a screen no Stitch**

Usar o MCP do Stitch para reabrir `projects/4065108259203499740/screens/d3ecb1c7960c419fad8fe2c9e6d91910` e extrair:
- ordem das seções
- headlines/subheadlines
- grupos de cards
- CTA labels
- direção visual dominante

Expected: lista textual da anatomia da landing registrada no contexto da execução.

- [ ] **Step 2: Criar teste de render da landing (RED)**

Criar `__tests__/app/marketing/landing-page.test.tsx` para garantir pelo menos:

```typescript
import { render, screen } from '@testing-library/react'
import { BeautlyLandingPage } from '@/app/_components/marketing/landing-page'

describe('BeautlyLandingPage', () => {
  it('renderiza o hero e CTAs principais', () => {
    render(<BeautlyLandingPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('renderiza pelo menos uma secao de prova social ou features', () => {
    render(<BeautlyLandingPage />)
    expect(screen.getByText(/beautly/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Rodar o teste e confirmar falha**

Run:
```bash
cd /home/fabio/Projetos/Beautly
npm test -- --run __tests__/app/marketing/landing-page.test.tsx
```

Expected: FAIL porque o componente ainda não existe.

- [ ] **Step 4: Criar `landing-data.ts` com conteúdo fixo**

Estruturar os dados em arrays/objetos simples para evitar JSX gigante:

```typescript
export const hero = {
  eyebrow: 'Beautly',
  title: '...',
  description: '...',
  primaryCta: '...',
  secondaryCta: '...',
}

export const featureCards = [
  { title: '...', description: '...' },
]
```

Usar textos e labels observados no Stitch. Não inventar fluxo funcional para CTA.

- [ ] **Step 5: Implementar `BeautlyLandingPage` com fidelidade alta**

Criar um componente puro:

```tsx
export function BeautlyLandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6efe8] text-[#1d170f]">
      <section>{/* hero */}</section>
      <section>{/* social proof / logos */}</section>
      <section>{/* features */}</section>
      <section>{/* pricing or benefits */}</section>
      <section>{/* faq or final cta */}</section>
    </main>
  )
}
```

Regras:
- seguir a ordem e o ritmo visual da screen do Stitch
- usar Tailwind no padrão do projeto
- preservar desktop como referência principal, sem sacrificar mobile
- CTAs em `button type="button"` se não houver destino

- [ ] **Step 6: Rodar o teste do componente**

Run:
```bash
cd /home/fabio/Projetos/Beautly
npm test -- --run __tests__/app/marketing/landing-page.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/_components/marketing/landing-page.tsx app/_components/marketing/landing-data.ts __tests__/app/marketing/landing-page.test.tsx
git commit -m "feat(marketing): build stitch-based beautly landing sections"
```

### Task 3: Ligar a landing à rota raiz

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Substituir a raiz por um wrapper simples**

Trocar a implementação atual de `app/page.tsx` por:

```tsx
import { BeautlyLandingPage } from '@/app/_components/marketing/landing-page'

export default function HomePage() {
  return <BeautlyLandingPage />
}
```

Remover `getCurrentTenant()`, `notFound()`, queries Supabase e qualquer dependência de serviços do tenant.

- [ ] **Step 2: Ajustar metadata global se necessário**

Em `app/layout.tsx`, atualizar `metadata` para refletir marketing da Beautly:

```typescript
export const metadata: Metadata = {
  title: 'Beautly',
  description: 'SaaS para estúdios e profissionais de beleza gerirem agenda, atendimento e crescimento.',
}
```

- [ ] **Step 3: Adicionar tokens globais mínimos da landing**

Se a landing precisar de background gradients, text-balance, ou classes utilitárias reutilizadas, registrar em `app/globals.css` sem contaminar o restante do app.

Exemplo:

```css
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

- [ ] **Step 4: Rodar lint e testes relacionados**

Run:
```bash
cd /home/fabio/Projetos/Beautly
npm run lint
npm test -- --run __tests__/lib/tenant.test.ts __tests__/middleware.test.ts __tests__/app/marketing/landing-page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Subir o app localmente para inspeção manual**

Run:
```bash
cd /home/fabio/Projetos/Beautly
npm run dev
```

Verificar manualmente:
- `/` mostra a landing SaaS
- `localhost:3000` continua com comportamento esperado de dev fallback apenas nas rotas tenant relevantes
- layout mobile não quebra hero/cards

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/layout.tsx app/globals.css
git commit -m "feat(marketing): serve beautly saas landing at public root"
```

---

## Chunk 3: Verification and Deploy Readiness

### Task 4: Verificar build e alinhar Vercel

**Files:**
- Modify: `vercel.json` (somente se necessário)

- [ ] **Step 1: Rodar verificação final local**

Run:
```bash
cd /home/fabio/Projetos/Beautly
npm run build
```

Expected: build sem erros.

- [ ] **Step 2: Confirmar alias/host público**

Inspecionar `vercel.json` e a configuração do projeto Vercel. Se o host público `beautly.vercel.app` já estiver ligado ao projeto, não alterar o arquivo. Se for necessário declarar algo adicional, fazer a menor mudança possível.

- [ ] **Step 3: Validar manualmente o deploy**

Após push/deploy, verificar em `2026-03-15`:
- `https://beautly.vercel.app/` mostra a landing SaaS
- `https://beautly-admin.vercel.app/` continua no super-admin
- preview de branch `beautly-git-*.vercel.app` continua usando fallback tenant

- [ ] **Step 4: Commit final de configuração, se houver**

```bash
git add vercel.json
git commit -m "chore(vercel): align public host for marketing landing"
```

Executar este commit apenas se `vercel.json` realmente mudar.
