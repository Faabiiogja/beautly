import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateBookingToken } from '@/lib/tokens'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: vi.fn(),
}))

describe('generateBookingToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna string de 64 caracteres hex', () => {
    const token = generateBookingToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('gera tokens diferentes a cada chamada', () => {
    const firstToken = generateBookingToken()
    const secondToken = generateBookingToken()

    expect(firstToken).not.toBe(secondToken)
  })
})
