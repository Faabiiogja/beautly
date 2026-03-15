# Tenant Home Page Design Spec

**Date:** 2026-03-15
**Status:** Approved
**Stitch screens:** Studio Demo Landing Page (mobile, ID: 94d7a5b9b9184df585d22457954cf85c), Studio Demo Landing Page Desktop (desktop, generated 2026-03-15)

---

## Goal

Replace the current behavior where `{slug}.beautly.cloud` renders the marketing landing page (`BeautlyLandingPage`) with a proper tenant-facing home page showing the studio's name, hero, and active services list with a booking CTA.

---

## Scope (MVP)

- Hero section: studio name + tagline + CTA button
- Services section: grid of active services (name, price, duration)
- No professionals section (future)
- No booking flow integration (CTA is static for MVP)
- Mobile-first, responsive up to desktop

---

## Architecture

### Context Detection

`app/page.tsx` is a Server Component. It reads the `x-context` and `x-tenant-slug` request headers injected by `middleware.ts`:

```typescript
import { headers } from 'next/headers'
import { TenantHomePage } from '@/components/tenant/home-page'
import BeautlyLandingPage from '@/components/marketing/landing-page'

export default async function RootPage() {
  const headersList = await headers()
  const context = headersList.get('x-context')
  const slug = headersList.get('x-tenant-slug')

  if (context === 'tenant' && slug) {
    return <TenantHomePage slug={slug} />
  }
  return <BeautlyLandingPage />
}
```

No changes to `middleware.ts` are required.

### Data Fetching

`TenantHomePage` is a Server Component. It uses the Supabase service role client (no RLS) to fetch:

1. **Tenant info** from `tenants` table: `name`, `description`, `cover_image_url` filtered by `slug`
2. **Active services** from `services` table: `id`, `name`, `price`, `duration_minutes` filtered by `tenant_id` and `active = true`, ordered by `name`

If the tenant is not found → `notFound()` (renders Next.js 404).
If services is empty → renders services section with "Em breve" empty state message.

### Component Tree

```
app/page.tsx                          ← Server Component (context switch)
components/tenant/
  home-page.tsx                       ← Server Component (fetch + layout orchestration)
  hero-section.tsx                    ← Studio name, tagline, CTA button
  services-section.tsx                ← Section title, "Ver todos" link, service grid
  service-card.tsx                    ← Individual card: name, price (R$), duration (min)
```

---

## Data Models

### `tenants` table (existing)
| Column | Type | Used |
|--------|------|------|
| id | uuid | FK for services query |
| slug | text | lookup key |
| name | text | display in hero |
| description | text | tagline in hero (nullable) |
| cover_image_url | text | hero image (nullable) |

### `services` table (existing)
| Column | Type | Used |
|--------|------|------|
| id | uuid | React key |
| tenant_id | uuid | filter |
| name | text | card title |
| price | numeric | formatted as R$ |
| duration_minutes | integer | formatted as "X min" |
| active | boolean | filter (only active) |

---

## Visual Design

Follows the Stitch "Studio Demo Landing Page" screens:

**Mobile (primary):**
- Dark background (`#0a0a0a`)
- Pink accent (`#ec4899`)
- Header: studio name + "Agendar agora" button
- Hero: full-width image, overlay with name + subtitle + CTA
- Services: vertical list cards (name, price, duration)
- Footer: "© {year} {studio name} · Powered by Beautly"

**Desktop:**
- Hero: text left / image right split layout
- Services: 4-column grid
- Same color system

**CTA button "Agendar agora":** Static for MVP (no `href`). Will link to booking flow in a future sprint.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Tenant slug not found in DB | `notFound()` → Next.js 404 page |
| `cover_image_url` is null | Show gradient placeholder (dark → pink) |
| `description` is null | Skip tagline, show name only in hero |
| No active services | Show services section with "Em breve" message |
| Supabase error | Throw → Next.js error boundary |

---

## Testing

| File | What it tests |
|------|---------------|
| `__tests__/app/page.test.tsx` | With `x-context: tenant` → renders `TenantHomePage`; with `x-context: marketing` → renders `BeautlyLandingPage` |
| `__tests__/components/tenant/home-page.test.tsx` | Mocked Supabase: studio name renders, service list renders, notFound called when tenant missing |
| `__tests__/components/tenant/service-card.test.tsx` | Price formatted as "R$ 80,00", duration formatted as "60 min" |

---

## Out of Scope (Future)

- Booking flow integration (CTA button functional)
- Professionals section
- Tenant-specific theming (custom colors)
- i18n
