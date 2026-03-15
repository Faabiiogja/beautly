import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockIs = vi.fn()
const mockGt = vi.fn()
const mockOrder = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockLimit = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: () => ({
    from: mockFrom,
  }),
}))

vi.mock('date-fns-tz', () => ({
  fromZonedTime: (dateStr: string, tz: string) => {
    // Simple stub: treat input as UTC for test purposes
    void tz
    return new Date(dateStr.replace('T', ' ').replace(/(\d{2}:\d{2}:\d{2}).*/, '$1') + 'Z')
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockLimit.mockReturnValue({ single: mockSingle })
  mockGt.mockReturnValue({ single: mockSingle })
  mockIs.mockReturnValue({ gt: mockGt })
  mockLte.mockReturnValue({ order: mockOrder })
  mockGte.mockReturnValue({ lte: mockLte })
  mockEq.mockReturnValue({
    is: mockIs,
    eq: mockEq,
    single: mockSingle,
    gte: mockGte,
    order: mockOrder,
  })
  mockOrder.mockReturnValue({ limit: mockLimit })
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
})

import {
  getBookingById,
  getBookingByToken,
  getBookingsByDate,
} from '@/domain/bookings/queries'

describe('getBookingByToken', () => {
  it('retorna null quando token nao existe', async () => {
    const result = await getBookingByToken('token-inexistente')
    expect(result).toBeNull()
  })

  it('chama from("booking_tokens") com o token correto', async () => {
    await getBookingByToken('abc123')
    expect(mockFrom).toHaveBeenCalledWith('booking_tokens')
  })

  it('filtra por revoked_at IS NULL', async () => {
    await getBookingByToken('abc123')
    expect(mockIs).toHaveBeenCalledWith('revoked_at', null)
  })

  it('filtra por expires_at maior que agora', async () => {
    await getBookingByToken('abc123')
    expect(mockGt).toHaveBeenCalledWith('expires_at', expect.any(String))
  })
})

describe('getBookingById', () => {
  it('retorna null quando booking nao existe', async () => {
    const result = await getBookingById(
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222'
    )
    expect(result).toBeNull()
  })

  it('chama from("bookings")', async () => {
    await getBookingById(
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222'
    )
    expect(mockFrom).toHaveBeenCalledWith('bookings')
  })

  it('filtra por tenant_id para garantir isolamento', async () => {
    const tenantId = '22222222-2222-2222-2222-222222222222'
    await getBookingById('11111111-1111-1111-1111-111111111111', tenantId)
    expect(mockEq).toHaveBeenCalledWith('tenant_id', tenantId)
  })
})

describe('getBookingsByDate', () => {
  it('retorna array vazio quando nao ha bookings', async () => {
    const result = await getBookingsByDate(
      '22222222-2222-2222-2222-222222222222',
      '2026-03-18',
      'America/Sao_Paulo'
    )
    expect(result).toEqual([])
  })

  it('filtra por tenant_id para garantir isolamento', async () => {
    const tenantId = '22222222-2222-2222-2222-222222222222'
    await getBookingsByDate(tenantId, '2026-03-18', 'America/Sao_Paulo')
    expect(mockEq).toHaveBeenCalledWith('tenant_id', tenantId)
  })
})
