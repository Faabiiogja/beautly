# Booking Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o fluxo público de agendamento em `slug.beautly.com` — landing page, wizard multi-step (serviço → profissional → data/hora → confirmação), e página de visualização via link WhatsApp.

**Architecture:** Multi-page wizard com URLs reais por passo (sem route groups), estado passado via `searchParams`. Server Components por padrão; Client Components apenas onde há interatividade (calendário, formulário). Server Action `confirmBooking()` centraliza toda a lógica de negócio. `lib/availability.ts` calcula slots isolado de qualquer framework para ser testável.

**Tech Stack:** Next.js 15 App Router, Supabase `service_role`, Zod, date-fns v4 + date-fns-tz, shadcn/ui Calendar (react-day-picker v9), sonner toasts, TypeScript

---

## Chunk 1: Dependências + lib utilities (tokens, whatsapp)

### Task 1: Instalar dependências faltantes

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar zod e date-fns-tz**

```bash
npm install zod date-fns-tz
```

Expected: ambas aparecem em `dependencies` no `package.json`

- [ ] **Step 2: Verificar instalação**

```bash
node -e "require('zod'); require('date-fns-tz'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add zod and date-fns-tz"
```

---

### Task 2: lib/tokens.ts com testes

**Files:**
- Create: `lib/tokens.ts`
- Create: `__tests__/lib/tokens.test.ts`

- [ ] **Step 1: Escrever os testes falhando**

```typescript
// __tests__/lib/tokens.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateBookingToken } from '@/lib/tokens'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: vi.fn(),
}))

describe('generateBookingToken', () => {
  it('retorna string de 64 caracteres hex', () => {
    const token = generateBookingToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('gera tokens diferentes a cada chamada', () => {
    const t1 = generateBookingToken()
    const t2 = generateBookingToken()
    expect(t1).not.toBe(t2)
  })
})
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```bash
npm test -- --run __tests__/lib/tokens.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implementar lib/tokens.ts**

```typescript
// lib/tokens.ts
import { randomBytes } from 'crypto'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

/**
 * Gera um token seguro de 64 chars hex (256 bits de entropia).
 */
export function generateBookingToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Cria e persiste um booking_token no banco.
 * expires_at = ends_at + 2 dias (token válido até 2 dias após o atendimento).
 */
export async function createBookingToken(
  bookingId: string,
  endsAt: Date
): Promise<string> {
  const token = generateBookingToken()
  const expiresAt = new Date(endsAt.getTime() + 2 * 24 * 60 * 60 * 1000)

  const supabase = createSupabaseServiceClient()
  const { error } = await supabase.from('booking_tokens').insert({
    booking_id: bookingId,
    token,
    expires_at: expiresAt.toISOString(),
  })

  if (error) throw new Error(`Failed to create booking token: ${error.message}`)
  return token
}

/**
 * Valida um token: deve existir, não estar expirado e não estar revogado.
 * Retorna o token row com o booking relacionado, ou null se inválido.
 */
export async function validateBookingToken(token: string) {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from('booking_tokens')
    .select(`
      *,
      booking:bookings(
        id, status, starts_at, ends_at, notes,
        service:services(id, name, duration_minutes, price),
        professional:professionals(id, name),
        customer:customers(id, name),
        tenant:tenants(id, name, primary_color)
      )
    `)
    .eq('token', token)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  return data ?? null
}
```

- [ ] **Step 4: Rodar testes para confirmar que passam**

```bash
npm test -- --run __tests__/lib/tokens.test.ts
```

Expected: PASS — 2 testes passando

- [ ] **Step 5: Commit**

```bash
git add lib/tokens.ts __tests__/lib/tokens.test.ts
git commit -m "feat(booking): add booking token utilities"
```

---

### Task 3: lib/whatsapp.ts

**Files:**
- Create: `lib/whatsapp.ts`

Nota: não há lógica testável aqui — o mock apenas loga. Sem testes unitários para este arquivo.

- [ ] **Step 1: Criar lib/whatsapp.ts**

```typescript
// lib/whatsapp.ts

interface WhatsAppProvider {
  sendBookingConfirmation(
    phone: string,
    bookingUrl: string,
    tenantName: string,
    serviceName: string,
    startsAt: string
  ): Promise<void>
}

class MockWhatsAppProvider implements WhatsAppProvider {
  async sendBookingConfirmation(
    phone: string,
    bookingUrl: string,
    tenantName: string,
    serviceName: string,
    startsAt: string
  ): Promise<void> {
    console.log('[WhatsApp MOCK] ─────────────────────────')
    console.log(`  Para:    ${phone}`)
    console.log(`  Salão:   ${tenantName}`)
    console.log(`  Serviço: ${serviceName}`)
    console.log(`  Horário: ${startsAt}`)
    console.log(`  Link:    ${bookingUrl}`)
    console.log('[WhatsApp MOCK] ─────────────────────────')
  }
}

// Placeholder para integração real — implementar na Fase 2
class MetaCloudWhatsAppProvider implements WhatsAppProvider {
  async sendBookingConfirmation(): Promise<void> {
    throw new Error('Meta Cloud API not implemented yet')
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.WHATSAPP_MOCK === 'true'
  ) {
    return new MockWhatsAppProvider()
  }
  return new MetaCloudWhatsAppProvider()
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add lib/whatsapp.ts
git commit -m "feat(booking): add WhatsApp provider with mock"
```

---

## Chunk 2: lib/availability.ts + domain/bookings/

### Task 4: lib/availability.ts com testes

**Files:**
- Create: `lib/availability.ts`
- Create: `__tests__/lib/availability.test.ts`

- [ ] **Step 1: Adicionar ambiente node para testes de booking no vitest.config.ts**

Abrir `vitest.config.ts` e adicionar um projeto para `__tests__/booking/**`:

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
    projects: [
      {
        extends: true,
        test: {
          include: ['__tests__/super-admin/**/*.test.ts', '__tests__/lib/**/*.test.ts', '__tests__/booking/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          include: ['__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
          exclude: ['__tests__/super-admin/**', '__tests__/lib/**', '__tests__/booking/**', 'node_modules/**'],
          environment: 'jsdom',
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 2: Escrever os testes falhando**

```typescript
// __tests__/lib/availability.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSlots, filterAvailableSlots } from '@/lib/availability'

describe('generateSlots', () => {
  it('gera slots corretos para um dia aberto', () => {
    const slots = generateSlots({
      openTime: '09:00',
      closeTime: '11:00',
      slotDurationMinutes: 60,
      dateInTz: new Date('2026-03-18T12:00:00.000Z'), // qualquer UTC, a lógica usa a data
      timezone: 'America/Sao_Paulo',
    })
    // 09:00 e 10:00 cabem; 11:00 não (start + 60 > 11:00)
    expect(slots).toHaveLength(2)
    // Devem ser timestamps UTC correspondentes a 09:00 e 10:00 em SP
    // SP = UTC-3, então 09:00 SP = 12:00 UTC
    expect(slots[0]).toBe('2026-03-18T12:00:00.000Z')
    expect(slots[1]).toBe('2026-03-18T13:00:00.000Z')
  })

  it('retorna [] para dia fechado (openTime === closeTime)', () => {
    const slots = generateSlots({
      openTime: '09:00',
      closeTime: '09:00',
      slotDurationMinutes: 60,
      dateInTz: new Date('2026-03-18T12:00:00.000Z'),
      timezone: 'America/Sao_Paulo',
    })
    expect(slots).toHaveLength(0)
  })

  it('não gera slot se não cabe antes do fechamento', () => {
    const slots = generateSlots({
      openTime: '09:00',
      closeTime: '09:30',
      slotDurationMinutes: 60,
      dateInTz: new Date('2026-03-18T12:00:00.000Z'),
      timezone: 'America/Sao_Paulo',
    })
    expect(slots).toHaveLength(0)
  })
})

describe('filterAvailableSlots', () => {
  const slots = [
    '2026-03-18T12:00:00.000Z', // 09:00 SP
    '2026-03-18T13:00:00.000Z', // 10:00 SP
    '2026-03-18T14:00:00.000Z', // 11:00 SP
  ]

  it('remove slot ocupado por booking existente', () => {
    const bookings = [
      { starts_at: '2026-03-18T13:00:00.000Z', ends_at: '2026-03-18T14:00:00.000Z' },
    ]
    const result = filterAvailableSlots(slots, bookings, [], new Date('2026-03-17T00:00:00.000Z'))
    expect(result).not.toContain('2026-03-18T13:00:00.000Z')
    expect(result).toContain('2026-03-18T12:00:00.000Z')
    expect(result).toContain('2026-03-18T14:00:00.000Z')
  })

  it('remove slot coberto por schedule_block', () => {
    const blocks = [
      { start_at: '2026-03-18T12:00:00.000Z', end_at: '2026-03-18T13:30:00.000Z' },
    ]
    const result = filterAvailableSlots(slots, [], blocks, new Date('2026-03-17T00:00:00.000Z'))
    expect(result).not.toContain('2026-03-18T12:00:00.000Z')
    expect(result).toContain('2026-03-18T13:00:00.000Z')
  })

  it('remove slots no passado', () => {
    // "agora" é depois de todos os slots
    const now = new Date('2026-03-19T00:00:00.000Z')
    const result = filterAvailableSlots(slots, [], [], now)
    expect(result).toHaveLength(0)
  })

  it('mantém slots futuros sem conflito', () => {
    const now = new Date('2026-03-18T11:00:00.000Z') // antes de todos
    const result = filterAvailableSlots(slots, [], [], now)
    expect(result).toHaveLength(3)
  })
})
```

- [ ] **Step 3: Rodar testes para confirmar que falham**

```bash
npm test -- --run __tests__/lib/availability.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 4: Implementar lib/availability.ts**

```typescript
// lib/availability.ts
import { fromZonedTime } from 'date-fns-tz'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

interface GenerateSlotsParams {
  openTime: string       // 'HH:mm'
  closeTime: string      // 'HH:mm'
  slotDurationMinutes: number
  dateInTz: Date         // qualquer Date — usa apenas o Y-M-D no timezone informado
  timezone: string       // ex: 'America/Sao_Paulo'
}

/**
 * Gera todos os possíveis slots para um dia, retornando timestamps UTC.
 * Um slot entra na lista se start + slotDuration <= closeTime.
 */
export function generateSlots({
  openTime,
  closeTime,
  slotDurationMinutes,
  dateInTz,
  timezone,
}: GenerateSlotsParams): string[] {
  const slots: string[] = []

  // Obtém Y-M-D no timezone do tenant
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateInTz) // retorna 'YYYY-MM-DD'

  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  let current = openMinutes
  while (current + slotDurationMinutes <= closeMinutes) {
    const hh = String(Math.floor(current / 60)).padStart(2, '0')
    const mm = String(current % 60).padStart(2, '0')
    // Converte 'YYYY-MM-DD HH:mm' no timezone do tenant para UTC
    const utc = fromZonedTime(`${dateParts} ${hh}:${mm}`, timezone)
    slots.push(utc.toISOString())
    current += slotDurationMinutes
  }

  return slots
}

interface Booking {
  starts_at: string
  ends_at: string
}

interface ScheduleBlock {
  start_at: string
  end_at: string
}

/**
 * Filtra slots removendo: conflitos com bookings, conflitos com bloqueios, slots no passado.
 */
export function filterAvailableSlots(
  slots: string[],
  bookings: Booking[],
  blocks: ScheduleBlock[],
  now: Date
): string[] {
  return slots.filter((slot) => {
    const slotStart = new Date(slot).getTime()

    // Remove slots no passado
    if (slotStart <= now.getTime()) return false

    // Remove slots com overlap com bookings confirmados
    const hasBookingConflict = bookings.some((b) => {
      const bStart = new Date(b.starts_at).getTime()
      const bEnd = new Date(b.ends_at).getTime()
      return bStart < slotStart && slotStart < bEnd || bStart === slotStart
    })
    if (hasBookingConflict) return false

    // Remove slots com overlap com schedule_blocks
    const hasBlockConflict = blocks.some((b) => {
      const bStart = new Date(b.start_at).getTime()
      const bEnd = new Date(b.end_at).getTime()
      return bStart <= slotStart && slotStart < bEnd
    })
    if (hasBlockConflict) return false

    return true
  })
}

export interface GetAvailableSlotsParams {
  tenantId: string
  professionalId: string
  serviceId: string
  date: string   // 'YYYY-MM-DD' no timezone do tenant
  timezone: string
}

/**
 * Ponto de entrada principal: busca dados do banco e retorna slots disponíveis em UTC.
 */
export async function getAvailableSlots({
  tenantId,
  professionalId,
  serviceId,
  date,
  timezone,
}: GetAvailableSlotsParams): Promise<string[]> {
  const supabase = createSupabaseServiceClient()

  // Decodifica Y-M-D para obter o day_of_week no timezone do tenant
  const [year, month, day] = date.split('-').map(Number)
  const localDate = fromZonedTime(`${date} 12:00`, timezone)
  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(new Date(year, month - 1, day))
  // day_of_week: 0=Dom, 1=Seg, ..., 6=Sáb
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const dayNum = dayMap[dayOfWeek]

  // 1. Business hours do tenant para o dia
  const { data: bh } = await supabase
    .from('business_hours')
    .select('is_open, open_time, close_time')
    .eq('tenant_id', tenantId)
    .eq('day_of_week', dayNum)
    .single()

  if (!bh || !bh.is_open || !bh.open_time || !bh.close_time) return []

  // 2. Serviço (duração + buffer)
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes, buffer_minutes')
    .eq('id', serviceId)
    .eq('tenant_id', tenantId)
    .single()

  if (!service) return []

  const slotDuration = service.duration_minutes + service.buffer_minutes

  // 3. Gera todos os slots possíveis
  const allSlots = generateSlots({
    openTime: bh.open_time,
    closeTime: bh.close_time,
    slotDurationMinutes: slotDuration,
    dateInTz: localDate,
    timezone,
  })

  if (allSlots.length === 0) return []

  // 4. Bookings confirmados do profissional naquele dia
  const dayStart = fromZonedTime(`${date} 00:00`, timezone).toISOString()
  const dayEnd = fromZonedTime(`${date} 23:59:59`, timezone).toISOString()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('starts_at, ends_at')
    .eq('professional_id', professionalId)
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)
    .not('status', 'in', '("cancelled","rescheduled")')

  // 5. Schedule blocks do dia (profissional específico ou todos)
  const { data: blocks } = await supabase
    .from('schedule_blocks')
    .select('start_at, end_at')
    .eq('tenant_id', tenantId)
    .or(`professional_id.eq.${professionalId},professional_id.is.null`)
    .lte('start_at', dayEnd)
    .gte('end_at', dayStart)

  return filterAvailableSlots(allSlots, bookings ?? [], blocks ?? [], new Date())
}
```

- [ ] **Step 5: Rodar testes**

```bash
npm test -- --run __tests__/lib/availability.test.ts
```

Expected: PASS — 6 testes passando

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 7: Commit**

```bash
git add lib/availability.ts __tests__/lib/availability.test.ts vitest.config.ts
git commit -m "feat(booking): add availability slot generation logic"
```

---

### Task 5: domain/bookings/types.ts + queries.ts

**Files:**
- Create: `domain/bookings/types.ts`
- Create: `domain/bookings/queries.ts`
- Create: `__tests__/booking/queries.test.ts`

- [ ] **Step 1: Criar domain/bookings/types.ts**

```typescript
// domain/bookings/types.ts
import type { Database } from '@/types/database'

export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type BookingToken = Database['public']['Tables']['booking_tokens']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Professional = Database['public']['Tables']['professionals']['Row']

export interface BookingWithDetails {
  id: string
  status: string
  starts_at: string
  ends_at: string
  notes: string | null
  service: Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price'>
  professional: Pick<Professional, 'id' | 'name'>
  customer: Pick<Customer, 'id' | 'name'>
  tenant: { id: string; name: string; primary_color: string }
}

export interface ConfirmBookingInput {
  tenantId: string
  serviceId: string
  professionalId: string
  slot: string        // UTC ISO-8601 com Z
  customerName: string
  customerPhone: string // E.164
}

export interface ConfirmBookingResult {
  success: boolean
  bookingId?: string
  error?: 'slot_unavailable' | 'validation_error' | 'server_error'
  fieldErrors?: Record<string, string>
}
```

- [ ] **Step 2: Escrever testes falhando para queries**

```typescript
// __tests__/booking/queries.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockIs = vi.fn()
const mockGt = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: () => ({
    from: mockFrom,
  }),
}))

// Encadeamento fluente do Supabase mock
beforeEach(() => {
  vi.clearAllMocks()
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockGt.mockReturnValue({ single: mockSingle })
  mockIs.mockReturnValue({ gt: mockGt })
  mockEq.mockReturnValue({ is: mockIs, eq: mockEq, single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
})

import { getBookingByToken, getBookingById } from '@/domain/bookings/queries'

describe('getBookingByToken', () => {
  it('retorna null quando token não existe', async () => {
    const result = await getBookingByToken('token-inexistente')
    expect(result).toBeNull()
  })

  it('chama from("booking_tokens") com o token correto', async () => {
    await getBookingByToken('abc123')
    expect(mockFrom).toHaveBeenCalledWith('booking_tokens')
  })
})

describe('getBookingById', () => {
  it('retorna null quando booking não existe', async () => {
    const result = await getBookingById('uuid-qualquer', 'tenant-uuid')
    expect(result).toBeNull()
  })

  it('chama from("bookings")', async () => {
    await getBookingById('uuid-qualquer', 'tenant-uuid')
    expect(mockFrom).toHaveBeenCalledWith('bookings')
  })
})
```

- [ ] **Step 3: Rodar para confirmar falha**

```bash
npm test -- --run __tests__/booking/queries.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 4: Criar domain/bookings/queries.ts**

```typescript
// domain/bookings/queries.ts
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { BookingWithDetails } from './types'

const BOOKING_WITH_DETAILS_SELECT = `
  id, status, starts_at, ends_at, notes,
  service:services(id, name, duration_minutes, price),
  professional:professionals(id, name),
  customer:customers(id, name),
  tenant:tenants(id, name, primary_color)
` as const

/**
 * Busca booking via token seguro.
 * Valida: token não revogado + não expirado.
 */
export async function getBookingByToken(token: string): Promise<BookingWithDetails | null> {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from('booking_tokens')
    .select(`booking:bookings(${BOOKING_WITH_DETAILS_SELECT})`)
    .eq('token', token)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data?.booking) return null
  return data.booking as unknown as BookingWithDetails
}

/**
 * Busca booking por ID, garantindo isolamento de tenant.
 * Retorna null se o booking não pertencer ao tenant.
 */
export async function getBookingById(
  bookingId: string,
  tenantId: string
): Promise<BookingWithDetails | null> {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_DETAILS_SELECT)
    .eq('id', bookingId)
    .eq('tenant_id', tenantId)
    .single()

  if (!data) return null
  return data as unknown as BookingWithDetails
}

/**
 * Busca bookings de um profissional em um dia.
 * Usado pela agenda do tenant admin (Fase 2).
 */
export async function getBookingsByDate(
  tenantId: string,
  date: string // 'YYYY-MM-DD' UTC
): Promise<BookingWithDetails[]> {
  const supabase = createSupabaseServiceClient()
  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd = `${date}T23:59:59.999Z`

  const { data } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_DETAILS_SELECT)
    .eq('tenant_id', tenantId)
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)
    .order('starts_at')

  return (data ?? []) as unknown as BookingWithDetails[]
}
```

- [ ] **Step 5: Rodar testes**

```bash
npm test -- --run __tests__/booking/queries.test.ts
```

Expected: PASS — 4 testes passando

- [ ] **Step 6: Commit**

```bash
git add domain/bookings/types.ts domain/bookings/queries.ts __tests__/booking/queries.test.ts
git commit -m "feat(booking): add booking domain types and queries"
```

---

### Task 6: domain/bookings/actions.ts

**Files:**
- Create: `domain/bookings/actions.ts`
- Create: `__tests__/booking/actions.test.ts`

- [ ] **Step 1: Escrever testes falhando**

```typescript
// __tests__/booking/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de getCurrentTenant
vi.mock('@/lib/tenant', () => ({
  getCurrentTenant: vi.fn(),
}))

// Mock de getAvailableSlots
vi.mock('@/lib/availability', () => ({
  getAvailableSlots: vi.fn(),
}))

// Mock de Supabase
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: () => ({ from: mockFrom }),
}))

vi.mock('@/lib/whatsapp', () => ({
  getWhatsAppProvider: () => ({
    sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('@/lib/tokens', () => ({
  createBookingToken: vi.fn().mockResolvedValue('mock-token-abc'),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { getCurrentTenant } from '@/lib/tenant'
import { getAvailableSlots } from '@/lib/availability'
import { confirmBookingLogic } from '@/domain/bookings/actions'

const mockTenant = {
  id: 'tenant-123',
  name: 'Studio Demo',
  timezone: 'America/Sao_Paulo',
  primary_color: '#ec4899',
  slug: 'demo',
  status: 'active',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getCurrentTenant).mockResolvedValue(mockTenant as any)
  vi.mocked(getAvailableSlots).mockResolvedValue(['2026-03-18T12:00:00.000Z'])

  // Setup Supabase mock chain
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockInsert.mockReturnValue({ select: mockSelect })
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert })
})

describe('confirmBookingLogic', () => {
  const validInput = {
    serviceId: 'service-uuid',
    professionalId: 'professional-uuid',
    slot: '2026-03-18T12:00:00.000Z',
    customerName: 'Ana Silva',
    customerPhone: '+5511999999999',
  }

  it('retorna validation_error se slot não está disponível', async () => {
    vi.mocked(getAvailableSlots).mockResolvedValue(['2026-03-18T13:00:00.000Z']) // slot diferente
    const result = await confirmBookingLogic(validInput)
    expect(result.error).toBe('slot_unavailable')
  })

  it('retorna validation_error se customerName está vazio', async () => {
    const result = await confirmBookingLogic({ ...validInput, customerName: '' })
    expect(result.error).toBe('validation_error')
  })

  it('retorna validation_error se telefone não é E.164', async () => {
    const result = await confirmBookingLogic({ ...validInput, customerPhone: '11999999999' })
    expect(result.error).toBe('validation_error')
  })

  it('retorna validation_error se slot não é UTC ISO-8601 com Z', async () => {
    const result = await confirmBookingLogic({ ...validInput, slot: '2026-03-18T09:00:00' })
    expect(result.error).toBe('validation_error')
  })
})
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npm test -- --run __tests__/booking/actions.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Criar domain/bookings/actions.ts**

```typescript
// domain/bookings/actions.ts
'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { getCurrentTenant } from '@/lib/tenant'
import { getAvailableSlots } from '@/lib/availability'
import { createBookingToken } from '@/lib/tokens'
import { getWhatsAppProvider } from '@/lib/whatsapp'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { ConfirmBookingResult } from './types'

const ConfirmBookingSchema = z.object({
  serviceId: z.string().uuid(),
  professionalId: z.string().uuid(),
  slot: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'Slot deve ser UTC ISO-8601 com Z'),
  customerName: z.string().min(2, 'Nome obrigatório'),
  customerPhone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Telefone deve ser E.164'),
})

type ConfirmBookingInput = z.infer<typeof ConfirmBookingSchema>

/**
 * Lógica pura de confirmação — exportada separadamente para ser testável.
 * A Server Action `confirmBooking` é um wrapper fino sobre esta função.
 */
export async function confirmBookingLogic(
  input: ConfirmBookingInput
): Promise<ConfirmBookingResult> {
  // 1. Validação com Zod
  const parsed = ConfirmBookingSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'validation_error',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    }
  }

  const { serviceId, professionalId, slot, customerName, customerPhone } = parsed.data

  // 2. Tenant do host
  const tenant = await getCurrentTenant()
  if (!tenant) return { success: false, error: 'server_error' }

  const supabase = createSupabaseServiceClient()

  // 3. Verifica que service e professional pertencem ao tenant
  const [{ data: service }, { data: professional }] = await Promise.all([
    supabase.from('services').select('id, duration_minutes, buffer_minutes, name').eq('id', serviceId).eq('tenant_id', tenant.id).single(),
    supabase.from('professionals').select('id, name').eq('id', professionalId).eq('tenant_id', tenant.id).single(),
  ])

  if (!service || !professional) {
    return { success: false, error: 'validation_error' }
  }

  // 4. Re-valida slot server-side
  const slotDate = slot.slice(0, 10) // 'YYYY-MM-DD' UTC (aprox — suficiente para busca)
  const available = await getAvailableSlots({
    tenantId: tenant.id,
    professionalId,
    serviceId,
    date: slotDate,
    timezone: tenant.timezone,
  })

  if (!available.includes(slot)) {
    return { success: false, error: 'slot_unavailable' }
  }

  // 5. Calcula ends_at
  const slotMs = new Date(slot).getTime()
  const durationMs = (service.duration_minutes + service.buffer_minutes) * 60 * 1000
  const endsAt = new Date(slotMs + durationMs)

  // 6. Upsert customer — INSERT DO NOTHING + SELECT para obter ID
  await supabase.from('customers').insert({
    tenant_id: tenant.id,
    name: customerName,
    phone: customerPhone,
  }).select('id').single() // pode falhar silenciosamente se já existe

  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('phone', customerPhone)
    .single()

  if (!existingCustomer) return { success: false, error: 'server_error' }

  // 7. INSERT booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      tenant_id: tenant.id,
      customer_id: existingCustomer.id,
      service_id: serviceId,
      professional_id: professionalId,
      starts_at: slot,
      ends_at: endsAt.toISOString(),
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (bookingError || !booking) {
    // Violação do idx_no_double_booking ou outro erro
    return { success: false, error: 'slot_unavailable' }
  }

  // 8. Cria booking token
  const token = await createBookingToken(booking.id, endsAt)

  // 9. Envia WhatsApp (mockado em dev)
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_DOMAIN ? `https://${tenant.slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN}` : `http://localhost:3000`}/b/${token}`
  await getWhatsAppProvider().sendBookingConfirmation(
    customerPhone,
    bookingUrl,
    tenant.name,
    service.name,
    slot
  )

  return { success: true, bookingId: booking.id }
}

/**
 * Server Action — wrapper fino sobre confirmBookingLogic.
 * Chamado pelo formulário do cliente.
 */
export async function confirmBooking(
  _prevState: ConfirmBookingResult | null,
  formData: FormData
): Promise<ConfirmBookingResult> {
  const input = {
    serviceId: formData.get('serviceId') as string,
    professionalId: formData.get('professionalId') as string,
    slot: formData.get('slot') as string,
    customerName: formData.get('customerName') as string,
    customerPhone: formData.get('customerPhone') as string,
  }

  const result = await confirmBookingLogic(input)

  if (result.success && result.bookingId) {
    redirect(`/book/done?bookingId=${result.bookingId}`)
  }

  return result
}
```

- [ ] **Step 4: Rodar testes**

```bash
npm test -- --run __tests__/booking/actions.test.ts
```

Expected: PASS — 4 testes passando

- [ ] **Step 5: Rodar todos os testes**

```bash
npm test -- --run
```

Expected: todos passando

- [ ] **Step 6: Commit**

```bash
git add domain/bookings/types.ts domain/bookings/queries.ts domain/bookings/actions.ts __tests__/booking/actions.test.ts
git commit -m "feat(booking): add confirmBooking server action"
```

---

## Chunk 3: API route + Landing page + Páginas do wizard (parte 1)

### Task 7: app/api/availability/route.ts

**Files:**
- Create: `app/api/availability/route.ts`

- [ ] **Step 1: Criar a route**

```typescript
// app/api/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenant } from '@/lib/tenant'
import { getAvailableSlots } from '@/lib/availability'

export async function GET(req: NextRequest) {
  const tenant = await getCurrentTenant()
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const { searchParams } = req.nextUrl
  const professionalId = searchParams.get('professionalId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date') // 'YYYY-MM-DD'

  if (!professionalId || !serviceId || !date) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // Valida formato da data
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  // Valida que professional e service pertencem ao tenant
  const { createSupabaseServiceClient } = await import('@/lib/supabase/server')
  const supabase = createSupabaseServiceClient()

  const [{ data: prof }, { data: svc }] = await Promise.all([
    supabase.from('professionals').select('id').eq('id', professionalId).eq('tenant_id', tenant.id).single(),
    supabase.from('services').select('id').eq('id', serviceId).eq('tenant_id', tenant.id).single(),
  ])

  if (!prof || !svc) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 400 })
  }

  const slots = await getAvailableSlots({
    tenantId: tenant.id,
    professionalId,
    serviceId,
    date,
    timezone: tenant.timezone,
  })

  return NextResponse.json({ slots })
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add app/api/availability/route.ts
git commit -m "feat(booking): add availability API route"
```

---

### Task 8: Landing page — app/page.tsx

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Substituir smoke test pela landing page**

```typescript
// app/page.tsx
import { getCurrentTenant } from '@/lib/tenant'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const tenant = await getCurrentTenant()
  if (!tenant) notFound()

  const supabase = createSupabaseServiceClient()
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('name')

  const activeServices = services ?? []
  const primary = tenant.primary_color ?? '#ec4899'

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', padding: '48px 24px 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1c1917', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          {tenant.name}
        </h1>
        <p style={{ color: '#78716c', fontSize: '15px', marginBottom: '24px' }}>
          Agende seu horário com facilidade
        </p>
        <Link
          href="/book"
          style={{
            display: 'inline-block',
            background: primary,
            color: '#fff',
            padding: '12px 32px',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'none',
          }}
        >
          Agendar agora
        </Link>
      </div>

      {/* Serviços */}
      {activeServices.length > 0 && (
        <div style={{ padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', color: '#a8a29e', marginBottom: '16px' }}>
            NOSSOS SERVIÇOS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeServices.map((s) => (
              <div
                key={s.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1c1917' }}>{s.name}</div>
                  <div style={{ color: '#a8a29e', fontSize: '12px', marginTop: '2px' }}>
                    {s.duration_minutes} min
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: primary, fontSize: '15px' }}>
                  R$ {Number(s.price).toFixed(2).replace('.', ',')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Build rápido para verificar**

```bash
npm run build 2>&1 | grep -E "error|Error|✓|λ|○" | head -20
```

Expected: sem erros de compilação

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(booking): add tenant landing page"
```

---

### Task 9: Seleção de serviço — app/book/page.tsx

**Files:**
- Create: `app/book/page.tsx`

- [ ] **Step 1: Criar a página**

```typescript
// app/book/page.tsx
import { getCurrentTenant } from '@/lib/tenant'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BookPage() {
  const tenant = await getCurrentTenant()
  if (!tenant) notFound()

  const supabase = createSupabaseServiceClient()
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, description')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('name')

  const activeServices = services ?? []
  const primary = tenant.primary_color ?? '#ec4899'

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/" style={{ color: '#78716c', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div>
          <div style={{ fontSize: '11px', color: '#a8a29e', fontWeight: 500 }}>PASSO 1 DE 3</div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#1c1917', margin: 0 }}>Escolha o serviço</h1>
        </div>
      </div>

      {/* Lista de serviços */}
      <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activeServices.length === 0 && (
          <p style={{ color: '#a8a29e', textAlign: 'center', marginTop: '48px' }}>
            Nenhum serviço disponível no momento.
          </p>
        )}
        {activeServices.map((s) => (
          <Link
            key={s.id}
            href={`/book/${s.id}`}
            style={{
              background: '#fff',
              border: '1px solid #e7e5e4',
              borderRadius: '12px',
              padding: '16px',
              textDecoration: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#1c1917' }}>{s.name}</div>
              {s.description && (
                <div style={{ color: '#a8a29e', fontSize: '12px', marginTop: '2px' }}>{s.description}</div>
              )}
              <div style={{ color: '#a8a29e', fontSize: '12px', marginTop: '4px' }}>{s.duration_minutes} min</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: primary, fontSize: '16px' }}>
                R$ {Number(s.price).toFixed(2).replace('.', ',')}
              </div>
              <div style={{ color: '#d4d0cb', fontSize: '18px', marginTop: '4px' }}>›</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/book/page.tsx
git commit -m "feat(booking): add service selection page"
```

---

### Task 10: Profissional + calendário — app/book/[serviceId]/page.tsx

**Files:**
- Create: `app/book/[serviceId]/page.tsx`
- Create: `app/book/[serviceId]/_components/availability-picker.tsx`

- [ ] **Step 1: Criar o client component AvailabilityPicker**

```typescript
// app/book/[serviceId]/_components/availability-picker.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Slot {
  utc: string      // 'YYYY-MM-DDTHH:mm:ss.sssZ'
  label: string    // 'HH:mm' no timezone do tenant
}

interface AvailabilityPickerProps {
  serviceId: string
  professionalId: string
  timezone: string
  primary: string
}

function formatSlotLabel(utc: string, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utc))
}

function formatDateLabel(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export function AvailabilityPicker({
  serviceId,
  professionalId,
  timezone,
  primary,
}: AvailabilityPickerProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Gera os próximos 30 dias como opções de data
  const today = new Date()
  const dates: Date[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  async function handleDateSelect(date: Date) {
    setSelectedDate(date)
    setSlots([])
    setLoadingSlots(true)

    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)

    try {
      const res = await fetch(
        `/api/availability?professionalId=${professionalId}&serviceId=${serviceId}&date=${dateStr}`
      )
      const json = await res.json()
      const fetched: Slot[] = (json.slots ?? []).map((utc: string) => ({
        utc,
        label: formatSlotLabel(utc, timezone),
      }))
      setSlots(fetched)
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  function handleSlotSelect(slot: Slot) {
    startTransition(() => {
      router.push(
        `/book/confirm?serviceId=${serviceId}&professionalId=${professionalId}&slot=${encodeURIComponent(slot.utc)}`
      )
    })
  }

  return (
    <div>
      {/* Seleção de data — scroll horizontal */}
      <div style={{ overflowX: 'auto', display: 'flex', gap: '8px', padding: '0 24px 16px', scrollbarWidth: 'none' }}>
        {dates.map((d, i) => {
          const isSelected = selectedDate?.toDateString() === d.toDateString()
          const dayLabel = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, weekday: 'short' }).format(d)
          const dayNum = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, day: 'numeric' }).format(d)
          return (
            <button
              key={i}
              onClick={() => handleDateSelect(d)}
              style={{
                minWidth: '52px',
                padding: '10px 8px',
                borderRadius: '10px',
                border: isSelected ? 'none' : '1px solid #e7e5e4',
                background: isSelected ? primary : '#fff',
                color: isSelected ? '#fff' : '#1c1917',
                cursor: 'pointer',
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>{dayLabel}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>{dayNum}</div>
            </button>
          )
        })}
      </div>

      {/* Slots */}
      {selectedDate && (
        <div style={{ padding: '0 24px' }}>
          <div style={{ fontSize: '13px', color: '#78716c', marginBottom: '12px', textTransform: 'capitalize' }}>
            {formatDateLabel(selectedDate, timezone)}
          </div>

          {loadingSlots && (
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>Carregando horários...</p>
          )}

          {!loadingSlots && slots.length === 0 && (
            <p style={{ color: '#a8a29e', fontSize: '14px' }}>Nenhum horário disponível nesta data.</p>
          )}

          {!loadingSlots && slots.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {slots.map((slot) => (
                <button
                  key={slot.utc}
                  onClick={() => handleSlotSelect(slot)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '8px',
                    border: `1px solid ${primary}`,
                    background: '#fff',
                    color: primary,
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <p style={{ color: '#a8a29e', fontSize: '14px', padding: '0 24px' }}>
          Selecione uma data para ver os horários disponíveis.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Criar a página do serviço**

```typescript
// app/book/[serviceId]/page.tsx
import { getCurrentTenant } from '@/lib/tenant'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AvailabilityPicker } from './_components/availability-picker'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ serviceId: string }>
}

export default async function ServicePage({ params }: Props) {
  const { serviceId } = await params
  const tenant = await getCurrentTenant()
  if (!tenant) notFound()

  const supabase = createSupabaseServiceClient()

  // Valida que o serviço pertence ao tenant
  const { data: service } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, buffer_minutes')
    .eq('id', serviceId)
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .single()

  if (!service) notFound()

  // Profissionais ativos do tenant
  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, name, bio, avatar_url')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order')

  const activeProfessionals = professionals ?? []
  const primary = tenant.primary_color ?? '#ec4899'

  // Se 1 profissional, usa ele diretamente
  const singleProfessional = activeProfessionals.length === 1 ? activeProfessionals[0] : null

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/book" style={{ color: '#78716c', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div>
          <div style={{ fontSize: '11px', color: '#a8a29e', fontWeight: 500 }}>PASSO 2 DE 3</div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#1c1917', margin: 0 }}>Escolha data e horário</h1>
        </div>
      </div>

      {/* Resumo do serviço */}
      <div style={{ background: '#fff', padding: '12px 24px', borderBottom: '1px solid #f5f5f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>{service.name}</span>
        <span style={{ fontSize: '14px', color: primary, fontWeight: 700 }}>
          R$ {Number(service.price).toFixed(2).replace('.', ',')} · {service.duration_minutes} min
        </span>
      </div>

      {/* Seleção de profissional (só se >1) */}
      {!singleProfessional && activeProfessionals.length > 0 && (
        <ProfessionalSelector
          professionals={activeProfessionals}
          serviceId={serviceId}
          primary={primary}
          timezone={tenant.timezone}
        />
      )}

      {/* Com 1 profissional, mostra picker direto */}
      {singleProfessional && (
        <div style={{ paddingTop: '20px' }}>
          <AvailabilityPicker
            serviceId={serviceId}
            professionalId={singleProfessional.id}
            timezone={tenant.timezone}
            primary={primary}
          />
        </div>
      )}

      {activeProfessionals.length === 0 && (
        <p style={{ textAlign: 'center', color: '#a8a29e', padding: '48px 24px' }}>
          Nenhum profissional disponível no momento.
        </p>
      )}
    </main>
  )
}

// Sub-componente server para seleção de profissional (quando >1)
function ProfessionalSelector({
  professionals,
  serviceId,
  primary,
  timezone,
}: {
  professionals: { id: string; name: string; bio: string | null; avatar_url: string | null }[]
  serviceId: string
  primary: string
  timezone: string
}) {
  // Com múltiplos profissionais, usamos um estado client-side para seleção
  // Renderizamos como Server Component com links para versão simplificada:
  // cada profissional é um link que adiciona ?pro=id à URL, e lemos isso para mostrar o picker
  return (
    <div style={{ padding: '20px 24px' }}>
      <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#a8a29e', letterSpacing: '0.06em', marginBottom: '12px' }}>
        PROFISSIONAL
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {professionals.map((p) => (
          <Link
            key={p.id}
            href={`/book/${serviceId}/${p.id}`}
            style={{
              background: '#fff',
              border: `1px solid #e7e5e4`,
              borderRadius: '12px',
              padding: '14px 16px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: primary + '22', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: primary, fontWeight: 700, fontSize: '16px', flexShrink: 0,
            }}>
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1c1917' }}>{p.name}</div>
              {p.bio && <div style={{ fontSize: '12px', color: '#a8a29e', marginTop: '2px' }}>{p.bio}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Criar página para profissional específico quando >1**

```typescript
// app/book/[serviceId]/[professionalId]/page.tsx
import { getCurrentTenant } from '@/lib/tenant'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AvailabilityPicker } from '../_components/availability-picker'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ serviceId: string; professionalId: string }>
}

export default async function ServiceProfessionalPage({ params }: Props) {
  const { serviceId, professionalId } = await params
  const tenant = await getCurrentTenant()
  if (!tenant) notFound()

  const supabase = createSupabaseServiceClient()

  const [{ data: service }, { data: professional }] = await Promise.all([
    supabase.from('services').select('id, name, price, duration_minutes').eq('id', serviceId).eq('tenant_id', tenant.id).eq('is_active', true).single(),
    supabase.from('professionals').select('id, name').eq('id', professionalId).eq('tenant_id', tenant.id).eq('is_active', true).single(),
  ])

  if (!service || !professional) notFound()

  const primary = tenant.primary_color ?? '#ec4899'

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/book/${serviceId}`} style={{ color: '#78716c', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div>
          <div style={{ fontSize: '11px', color: '#a8a29e', fontWeight: 500 }}>PASSO 2 DE 3</div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#1c1917', margin: 0 }}>Escolha data e horário</h1>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '12px 24px', borderBottom: '1px solid #f5f5f4' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>{service.name}</span>
        <span style={{ fontSize: '13px', color: '#a8a29e', marginLeft: '8px' }}>· {professional.name}</span>
      </div>

      <div style={{ paddingTop: '20px' }}>
        <AvailabilityPicker
          serviceId={serviceId}
          professionalId={professionalId}
          timezone={tenant.timezone}
          primary={primary}
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Build para verificar**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Expected: sem erros

- [ ] **Step 5: Commit**

```bash
git add app/book/
git commit -m "feat(booking): add service/professional/schedule pages"
```

---

## Chunk 4: Confirmação, done, /b/[token]

### Task 11: Formulário de dados — app/book/confirm/

**Files:**
- Create: `app/book/confirm/page.tsx`
- Create: `app/book/confirm/_components/confirm-form.tsx`

- [ ] **Step 1: Criar confirm-form.tsx (Client Component)**

```typescript
// app/book/confirm/_components/confirm-form.tsx
'use client'

import { useActionState } from 'react'
import { confirmBooking } from '@/domain/bookings/actions'
import type { ConfirmBookingResult } from '@/domain/bookings/types'

interface ConfirmFormProps {
  serviceId: string
  professionalId: string
  slot: string
  primary: string
  // Resumo para exibição
  serviceName: string
  professionalName: string
  slotLabel: string
}

export function ConfirmForm({
  serviceId,
  professionalId,
  slot,
  primary,
  serviceName,
  professionalName,
  slotLabel,
}: ConfirmFormProps) {
  const [state, action, pending] = useActionState<ConfirmBookingResult | null, FormData>(
    confirmBooking,
    null
  )

  return (
    <form action={action} style={{ padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Campos ocultos */}
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="professionalId" value={professionalId} />
      <input type="hidden" name="slot" value={slot} />

      {/* Resumo */}
      <div style={{
        background: '#fff',
        border: '1px solid #e7e5e4',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
      }}>
        <div style={{ fontSize: '13px', color: '#a8a29e', marginBottom: '8px', fontWeight: 500 }}>RESUMO</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '4px' }}>{serviceName}</div>
        <div style={{ fontSize: '13px', color: '#78716c' }}>{professionalName} · {slotLabel}</div>
      </div>

      {/* Erro de slot indisponível */}
      {state?.error === 'slot_unavailable' && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px',
          color: '#dc2626',
          fontSize: '13px',
          marginBottom: '16px',
        }}>
          Horário não disponível, escolha outro.
        </div>
      )}

      {state?.error === 'server_error' && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px',
          color: '#dc2626',
          fontSize: '13px',
          marginBottom: '16px',
        }}>
          Erro ao salvar. Tente novamente.
        </div>
      )}

      {/* Campo: Nome */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#44403c', marginBottom: '6px' }}>
          Nome completo
        </label>
        <input
          name="customerName"
          type="text"
          placeholder="Seu nome"
          required
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: state?.fieldErrors?.customerName ? '1px solid #ef4444' : '1px solid #d6d3d1',
            fontSize: '15px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {state?.fieldErrors?.customerName && (
          <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            {state.fieldErrors.customerName}
          </span>
        )}
      </div>

      {/* Campo: Telefone */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#44403c', marginBottom: '6px' }}>
          WhatsApp (com DDI e DDD)
        </label>
        <input
          name="customerPhone"
          type="tel"
          placeholder="+5511999999999"
          required
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: state?.fieldErrors?.customerPhone ? '1px solid #ef4444' : '1px solid #d6d3d1',
            fontSize: '15px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {state?.fieldErrors?.customerPhone && (
          <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            {state.fieldErrors.customerPhone}
          </span>
        )}
        <span style={{ color: '#a8a29e', fontSize: '11px', marginTop: '4px', display: 'block' }}>
          Você receberá a confirmação por WhatsApp
        </span>
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '9999px',
          border: 'none',
          background: pending ? '#d6d3d1' : primary,
          color: '#fff',
          fontWeight: 700,
          fontSize: '15px',
          cursor: pending ? 'not-allowed' : 'pointer',
        }}
      >
        {pending ? 'Confirmando...' : 'Confirmar agendamento'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Criar confirm/page.tsx (Server Component)**

```typescript
// app/book/confirm/page.tsx
import { getCurrentTenant } from '@/lib/tenant'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ConfirmForm } from './_components/confirm-form'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ serviceId?: string; professionalId?: string; slot?: string }>
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { serviceId, professionalId, slot } = await searchParams

  if (!serviceId || !professionalId || !slot) notFound()

  const tenant = await getCurrentTenant()
  if (!tenant) notFound()

  const supabase = createSupabaseServiceClient()

  const [{ data: service }, { data: professional }] = await Promise.all([
    supabase.from('services').select('id, name, price, duration_minutes').eq('id', serviceId).eq('tenant_id', tenant.id).single(),
    supabase.from('professionals').select('id, name').eq('id', professionalId).eq('tenant_id', tenant.id).single(),
  ])

  if (!service || !professional) notFound()

  const primary = tenant.primary_color ?? '#ec4899'

  // Formata o slot para exibição no timezone do tenant
  const slotLabel = new Intl.DateTimeFormat('pt-BR', {
    timeZone: tenant.timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(slot))

  const backUrl = `/book/${serviceId}`

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={backUrl} style={{ color: '#78716c', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div>
          <div style={{ fontSize: '11px', color: '#a8a29e', fontWeight: 500 }}>PASSO 3 DE 3</div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#1c1917', margin: 0 }}>Seus dados</h1>
        </div>
      </div>

      <ConfirmForm
        serviceId={serviceId}
        professionalId={professionalId}
        slot={slot}
        primary={primary}
        serviceName={service.name}
        professionalName={professional.name}
        slotLabel={slotLabel}
      />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/book/confirm/
git commit -m "feat(booking): add booking confirmation form"
```

---

### Task 12: Página done — app/book/done/page.tsx

**Files:**
- Create: `app/book/done/page.tsx`

- [ ] **Step 1: Criar a página**

```typescript
// app/book/done/page.tsx
import { getCurrentTenant } from '@/lib/tenant'
import { getBookingById } from '@/domain/bookings/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ bookingId?: string }>
}

export default async function DonePage({ searchParams }: Props) {
  const { bookingId } = await searchParams

  const tenant = await getCurrentTenant()
  if (!tenant) notFound()

  const primary = tenant.primary_color ?? '#ec4899'

  // Tenta carregar detalhes do booking (pode ser null se bookingId inválido)
  const booking = bookingId ? await getBookingById(bookingId, tenant.id) : null

  const slotLabel = booking
    ? new Intl.DateTimeFormat('pt-BR', {
        timeZone: tenant.timezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(booking.starts_at))
    : null

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Check icon */}
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', marginBottom: '20px',
      }}>
        ✓
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1c1917', marginBottom: '8px', textAlign: 'center' }}>
        Agendamento confirmado!
      </h1>
      <p style={{ color: '#78716c', fontSize: '14px', textAlign: 'center', marginBottom: '24px', maxWidth: '320px' }}>
        Em breve você recebe o link com os detalhes por WhatsApp.
      </p>

      {/* Resumo (se disponível) */}
      {booking && slotLabel && (
        <div style={{
          background: '#fff',
          border: '1px solid #e7e5e4',
          borderRadius: '12px',
          padding: '16px 20px',
          width: '100%',
          maxWidth: '360px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '4px' }}>
            {booking.service.name}
          </div>
          <div style={{ fontSize: '13px', color: '#78716c' }}>
            {booking.professional.name}
          </div>
          <div style={{ fontSize: '13px', color: '#78716c', marginTop: '2px', textTransform: 'capitalize' }}>
            {slotLabel}
          </div>
        </div>
      )}

      {/* Link de dev */}
      {process.env.NODE_ENV === 'development' && bookingId && (
        <div style={{
          background: '#fefce8',
          border: '1px solid #fde047',
          borderRadius: '8px',
          padding: '12px',
          width: '100%',
          maxWidth: '360px',
          marginBottom: '16px',
          fontSize: '11px',
          color: '#713f12',
        }}>
          <strong>DEV:</strong> Para testar, você precisará buscar o token em{' '}
          <code>booking_tokens</code> no Supabase Studio (localhost:54323).
        </div>
      )}

      <Link
        href="/"
        style={{
          color: primary,
          fontWeight: 600,
          fontSize: '14px',
          textDecoration: 'none',
        }}
      >
        Voltar ao início
      </Link>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/book/done/page.tsx
git commit -m "feat(booking): add booking done confirmation page"
```

---

### Task 13: Visualização do agendamento — app/b/[token]/page.tsx

**Files:**
- Create: `app/b/[token]/page.tsx`

- [ ] **Step 1: Criar a página**

```typescript
// app/b/[token]/page.tsx
import { getBookingByToken } from '@/domain/bookings/queries'
import { getCurrentTenant } from '@/lib/tenant'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:   { label: 'Confirmado',  color: '#16a34a', bg: '#dcfce7' },
  cancelled:   { label: 'Cancelado',   color: '#dc2626', bg: '#fee2e2' },
  rescheduled: { label: 'Reagendado',  color: '#d97706', bg: '#fef3c7' },
  completed:   { label: 'Concluído',   color: '#6b7280', bg: '#f3f4f6' },
}

export default async function BookingTokenPage({ params }: Props) {
  const { token } = await params

  const booking = await getBookingByToken(token)

  if (!booking) {
    return (
      <main style={{
        fontFamily: 'system-ui, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#fafaf9',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔗</div>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1c1917', marginBottom: '8px' }}>
          Link não disponível
        </h1>
        <p style={{ color: '#78716c', fontSize: '14px', textAlign: 'center', maxWidth: '280px' }}>
          Este link não está mais disponível ou expirou.
        </p>
      </main>
    )
  }

  const tenant = await getCurrentTenant()
  const primary = booking.tenant.primary_color ?? tenant?.primary_color ?? '#ec4899'
  const timezone = tenant?.timezone ?? 'America/Sao_Paulo'

  const badge = STATUS_LABEL[booking.status] ?? STATUS_LABEL.confirmed

  const slotLabel = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(booking.starts_at))

  const timeLabel = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(booking.starts_at))

  return (
    <main style={{
      fontFamily: 'system-ui, sans-serif',
      background: '#fafaf9',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 24px',
    }}>
      {/* Logo/nome do salão */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: primary, letterSpacing: '0.06em' }}>
          {booking.tenant.name.toUpperCase()}
        </div>
      </div>

      {/* Card do agendamento */}
      <div style={{
        background: '#fff',
        border: '1px solid #e7e5e4',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '360px',
        marginBottom: '16px',
      }}>
        {/* Status badge */}
        <div style={{
          display: 'inline-flex',
          background: badge.bg,
          color: badge.color,
          fontWeight: 600,
          fontSize: '12px',
          padding: '4px 12px',
          borderRadius: '9999px',
          marginBottom: '16px',
        }}>
          {badge.label}
        </div>

        {/* Serviço */}
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#1c1917', marginBottom: '4px' }}>
          {booking.service.name}
        </div>

        {/* Profissional */}
        <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '16px' }}>
          com {booking.professional.name}
        </div>

        <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#a8a29e' }}>Data</span>
            <span style={{ color: '#1c1917', fontWeight: 500, textAlign: 'right', maxWidth: '200px', textTransform: 'capitalize' }}>
              {slotLabel}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#a8a29e' }}>Horário</span>
            <span style={{ color: '#1c1917', fontWeight: 500 }}>{timeLabel}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#a8a29e' }}>Duração</span>
            <span style={{ color: '#1c1917', fontWeight: 500 }}>{booking.service.duration_minutes} min</span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#a8a29e', textAlign: 'center', maxWidth: '280px' }}>
        Dúvidas? Entre em contato com o salão.
      </p>
    </main>
  )
}
```

- [ ] **Step 2: Rodar todos os testes**

```bash
npm test -- --run
```

Expected: todos passando

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Expected: sem erros

- [ ] **Step 5: Build completo**

```bash
npm run build
```

Expected: build limpo, rotas `/book`, `/book/[serviceId]`, `/book/confirm`, `/book/done`, `/b/[token]` visíveis

- [ ] **Step 6: Commit final**

```bash
git add app/b/[token]/page.tsx app/book/confirm/ app/book/done/
git commit -m "feat(booking): add token view page and complete booking wizard"
```

- [ ] **Step 7: Git log para verificar os commits do feature**

```bash
git log --oneline feature/booking-flow ^main | head -20
```

Expected: lista de commits da feature
