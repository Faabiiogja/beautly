import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockIs = vi.fn()
const mockGt = vi.fn()
const mockOrder = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: () => ({
    from: mockFrom,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockGt.mockReturnValue({ single: mockSingle })
  mockIs.mockReturnValue({ gt: mockGt })
  mockLte.mockReturnValue({ order: mockOrder })
  mockGte.mockReturnValue({ lte: mockLte })
  mockEq.mockReturnValue({
    is: mockIs,
    eq: mockEq,
    single: mockSingle,
    gte: mockGte,
  })
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
})

describe('getBookingsByDate', () => {
  it('retorna array vazio quando nao ha bookings', async () => {
    const result = await getBookingsByDate(
      '22222222-2222-2222-2222-222222222222',
      '2026-03-18'
    )
    expect(result).toEqual([])
  })
})
