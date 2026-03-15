import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}))

const mockUpsert = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockFrom = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: () => ({ from: mockFrom }),
}))

import { requireAdmin } from '@/lib/admin/auth'
import {
  upsertBusinessHourLogic,
  createScheduleBlockLogic,
  deleteScheduleBlockLogic,
} from '@/app/admin/(protected)/schedule/actions'

const mockSession = {
  userId: 'user-uuid',
  tenantId: 'tenant-uuid',
  role: 'owner' as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireAdmin).mockResolvedValue(mockSession)

  mockEq.mockReturnValue({ eq: mockEq, select: mockSelect })
  mockSelect.mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'x' }, error: null }) })
  mockUpsert.mockResolvedValue({ error: null })
  mockInsert.mockResolvedValue({ error: null })
  mockDelete.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'x' }], error: null }) })
  mockFrom.mockReturnValue({
    upsert: mockUpsert,
    insert: mockInsert,
    delete: mockDelete,
  })
})

describe('upsertBusinessHourLogic', () => {
  it('retorna validation_error se day_of_week invalido (> 6)', async () => {
    const result = await upsertBusinessHourLogic({
      day_of_week: 7,
      open_time: '09:00',
      close_time: '18:00',
      is_open: true,
    })
    expect(result.error).toBe('validation_error')
  })

  it('retorna validation_error se is_open true mas open_time nulo', async () => {
    const result = await upsertBusinessHourLogic({
      day_of_week: 1,
      open_time: null,
      close_time: '18:00',
      is_open: true,
    })
    expect(result.error).toBe('validation_error')
  })

  it('retorna success se dados validos', async () => {
    const result = await upsertBusinessHourLogic({
      day_of_week: 1,
      open_time: '09:00',
      close_time: '18:00',
      is_open: true,
    })
    expect(result.success).toBe(true)
  })
})

describe('createScheduleBlockLogic', () => {
  it('retorna validation_error se end_at menor ou igual a start_at', async () => {
    const result = await createScheduleBlockLogic({
      start_at: '2026-03-20T12:00:00.000Z',
      end_at: '2026-03-20T10:00:00.000Z',
      reason: null,
    })
    expect(result.error).toBe('validation_error')
  })

  it('retorna success quando dados validos', async () => {
    const result = await createScheduleBlockLogic({
      start_at: '2026-03-20T10:00:00.000Z',
      end_at: '2026-03-20T12:00:00.000Z',
      reason: null,
    })
    expect(result.success).toBe(true)
  })
})
