import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/tenant', () => ({
  getCurrentTenant: vi.fn(),
}))

vi.mock('@/lib/availability', () => ({
  getAvailableSlots: vi.fn(),
}))

const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
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

import { getAvailableSlots } from '@/lib/availability'
import { getCurrentTenant } from '@/lib/tenant'
import { confirmBookingLogic } from '@/domain/bookings/actions'

const mockTenant = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Studio Demo',
  timezone: 'America/Sao_Paulo',
  primary_color: '#ec4899',
  slug: 'demo',
  status: 'active',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getCurrentTenant).mockResolvedValue(mockTenant as never)
  vi.mocked(getAvailableSlots).mockResolvedValue([
    '2026-03-18T12:00:00.000Z',
  ])

  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockInsert.mockReturnValue({ select: mockSelect })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'services') {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: '11111111-1111-4111-8111-111111111111',
          duration_minutes: 60,
          buffer_minutes: 0,
          name: 'Corte',
        },
        error: null,
      })
    }

    if (table === 'professionals') {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Bia',
        },
        error: null,
      })
    }

    if (table === 'customers') {
      mockSingle.mockResolvedValueOnce({
        data: { id: '33333333-3333-4333-8333-333333333333' },
        error: null,
      })
    }

    if (table === 'bookings') {
      mockSingle.mockResolvedValueOnce({
        data: { id: '44444444-4444-4444-8444-444444444444' },
        error: null,
      })
    }

    return { select: mockSelect, insert: mockInsert }
  })
})

describe('confirmBookingLogic', () => {
  const validInput = {
    serviceId: '11111111-1111-4111-8111-111111111111',
    professionalId: '22222222-2222-4222-8222-222222222222',
    slot: '2026-03-18T12:00:00.000Z',
    customerName: 'Ana Silva',
    customerPhone: '+5511999999999',
  }

  it('retorna slot_unavailable se slot nao esta disponivel', async () => {
    vi.mocked(getAvailableSlots).mockResolvedValue([
      '2026-03-18T13:00:00.000Z',
    ])

    const result = await confirmBookingLogic(validInput)

    expect(result.error).toBe('slot_unavailable')
  })

  it('retorna validation_error se customerName esta vazio', async () => {
    const result = await confirmBookingLogic({
      ...validInput,
      customerName: '',
    })

    expect(result.error).toBe('validation_error')
  })

  it('retorna validation_error se telefone nao e E.164', async () => {
    const result = await confirmBookingLogic({
      ...validInput,
      customerPhone: '11999999999',
    })

    expect(result.error).toBe('validation_error')
  })

  it('retorna validation_error se slot nao e UTC ISO-8601 com Z', async () => {
    const result = await confirmBookingLogic({
      ...validInput,
      slot: '2026-03-18T09:00:00',
    })

    expect(result.error).toBe('validation_error')
  })
})
