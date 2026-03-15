# Tenant Home Page Design Spec

**Date:** 2026-03-15
**Status:** Approved
**Stitch screens:** Studio Demo Landing Page (mobile, ID: 94d7a5b9b9184df585d22457954cf85c), Studio Demo Landing Page Desktop (desktop, generated 2026-03-15)

---

## Goal

Replace the current behavior where `{slug}.beautly.cloud` renders the marketing landing page (`BeautlyLandingPage`) with a proper tenant-facing home page showing the studio's name, hero, and active services list with a booking CTA.

---

## Scope (MVP)

- Hero section: studio name + CTA button + logo (if available) or gradient placeholder
- Services section: grid of active services (name, price, duration)
- No professionals section (future)
- No booking flow integration (CTA is static for MVP — `<button>` element, not `<a>`)
- Mobile-first, responsive up to desktop

---

## Architecture

### Context Detection

`app/page.tsx` is a Server Component. It reads the `x-context` and `x-tenant-slug` request headers injected by `middleware.ts`. No changes to `middleware.ts` are required.

```typescript
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

Note: `TenantHomePage` reads `x-tenant-slug` internally via `getCurrentTenant()`.

### Data Fetching

`TenantHomePage` is a Server Component that uses existing helpers from `lib/tenant.ts`:

1. **Tenant info**: call `getCurrentTenant()` (already cached via `unstable_cache` with 60s revalidation, filters `status = 'active'`)
2. **Active services**: call `getServicesByTenantId(tenant.id)` — a new cached function to be added to `lib/tenant.ts`

```typescript
// Addition to lib/tenant.ts
export const getServicesByTenantId = unstable_cache(
  async (tenantId: string) => {
    const supabase = createSupabaseServiceClient()
    const { data } = await supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name')
    return data ?? []
  },
  ['services-by-tenant'],
  { revalidate: 60 }
)
```

If `getCurrentTenant()` returns null → `notFound()` (renders Next.js 404).
If services array is empty → render services section with "Em breve" empty state.
If Supabase throws → propagate to Next.js error boundary.

### Component Tree

```
app/page.tsx                          ← Server Component (context switch)
components/tenant/
  home-page.tsx                       ← Server Component (calls getCurrentTenant + getServicesByTenantId, layout)
  hero-section.tsx                    ← Studio name, CTA button, logo or gradient placeholder
  services-section.tsx                ← Section title, "Ver todos" link, service grid
  service-card.tsx                    ← Individual card: name, price (R$), duration (min)
```

---

## Data Models

### `tenants` table (existing columns used)
| Column | Type | Used for |
|--------|------|----------|
| id | uuid | FK for services query |
| slug | text | resolved via `getCurrentTenant()` |
| name | text | display in hero |
| logo_url | text \| null | hero image (gradient placeholder if null) |
| primary_color | text (NOT NULL) | accent color — always present, bank enforces DEFAULT `'#ec4899'` |
| status | text | filtered to `'active'` by `getTenantBySlug` |

### `services` table (existing columns used)
| Column | Type | Used for |
|--------|------|----------|
| id | uuid | React key |
| tenant_id | uuid | filter |
| name | text | card title |
| price | number | formatted as "R$ 80,00" |
| duration_minutes | number | formatted as "60 min" |
| is_active | boolean | filter (only `true`) |

---

## Visual Design

Follows the Stitch "Studio Demo Landing Page" screens:

**Mobile (primary, 390px):**
- Dark background (`#0a0a0a`)
- Pink accent (`#ec4899`)
- Header: studio name + "Agendar agora" button
- Hero: logo image (or dark→pink gradient placeholder), overlay with studio name + CTA
- Services: vertical list of cards (name, price, duration)
- Footer: "© {year} {studio name} · Powered by Beautly"

**Desktop (1440px):**
- Hero: text left / logo-or-placeholder right split layout
- Services: 4-column grid
- Same color system

**CTA "Agendar agora":** Rendered as `<button type="button">` (not `<a>`). Static for MVP — will receive `onClick` / `href` in the booking flow sprint. Add `title="Em breve"` for accessibility.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `getCurrentTenant()` returns null | `notFound()` → Next.js 404 page |
| `logo_url` is null | Show dark → pink gradient as hero background |
| No active services | Show services section with "Em breve" paragraph |
| `getServicesByTenantId` throws | Propagate → Next.js error boundary |

---

## Testing

| File | What it tests |
|------|---------------|
| `__tests__/app/page.test.tsx` | `x-context: tenant` → renders `TenantHomePage`; `x-context: marketing` → renders `BeautlyLandingPage` |
| `__tests__/components/tenant/home-page.test.tsx` | Mocked `getCurrentTenant` + `getServicesByTenantId`: renders studio name; renders service list; calls `notFound()` when tenant is null; renders empty state when services array is empty |
| `__tests__/components/tenant/service-card.test.tsx` | Price formatted as "R$ 80,00"; duration formatted as "60 min" |
| `__tests__/lib/tenant.test.ts` | `getServicesByTenantId` filters by `tenant_id` and `is_active = true` |

---

## Out of Scope (Future)

- Booking flow integration (CTA button functional)
- Professionals section
- Tenant-specific theming (custom primary_color applied dynamically)
- i18n
- DB migration to add `description` / `cover_image_url` columns (deferred)
