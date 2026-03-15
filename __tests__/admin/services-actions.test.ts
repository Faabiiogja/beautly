import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}))

const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: () => ({ from: mockFrom }),
}))

import { requireAdmin } from '@/lib/admin/auth'
import {
  createServiceLogic,
  updateServiceLogic,
  toggleServiceLogic,
  deleteServiceLogic,
} from '@/app/admin/(protected)/services/actions'

const mockSession = {
  userId: 'user-uuid',
  tenantId: 'tenant-uuid',
  role: 'owner' as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireAdmin).mockResolvedValue(mockSession)

  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  const mockInsertSelect = vi.fn().mockReturnValue({ single: mockSingle })
  mockInsert.mockReturnValue({ select: mockInsertSelect })
  const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockSingle })
  mockUpdate.mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: mockUpdateSelect }) }) })
  mockDelete.mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) })
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })
})

describe('createServiceLogic', () => {
  it('retorna validation_error se nome esta vazio', async () => {
    const result = await createServiceLogic({ name: '', duration_minutes: 60 })
    expect(result.error).toBe('validation_error')
  })

  it('retorna validation_error se duration_minutes menor que 1', async () => {
    const result = await createServiceLogic({ name: 'Corte', duration_minutes: 0 })
    expect(result.error).toBe('validation_error')
  })

  it('retorna success com id quando dados validos', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'service-uuid', name: 'Corte' },
      error: null,
    })
    const result = await createServiceLogic({ name: 'Corte', duration_minutes: 60 })
    expect(result.success).toBe(true)
  })
})

describe('updateServiceLogic', () => {
  it('retorna validation_error se nome esta vazio', async () => {
    const result = await updateServiceLogic('service-uuid', { name: '', duration_minutes: 60 })
    expect(result.error).toBe('validation_error')
  })

  it('retorna success quando dados validos', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'service-uuid', name: 'Corte' },
      error: null,
    })
    const result = await updateServiceLogic('service-uuid', { name: 'Corte', duration_minutes: 60 })
    expect(result.success).toBe(true)
  })
})

describe('toggleServiceLogic', () => {
  it('retorna success ao alternar status', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'service-uuid', is_active: false },
      error: null,
    })
    const result = await toggleServiceLogic('service-uuid', false)
    expect(result.success).toBe(true)
  })
})
