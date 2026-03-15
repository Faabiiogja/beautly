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
  createProfessionalLogic,
  updateProfessionalLogic,
  toggleProfessionalLogic,
  deleteProfessionalLogic,
} from '@/app/admin/(protected)/professionals/actions'

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

describe('createProfessionalLogic', () => {
  it('retorna validation_error se nome esta vazio', async () => {
    const result = await createProfessionalLogic({ name: '' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('validation_error')
  })

  it('retorna success com dados validos', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'professional-uuid', name: 'Ana Silva' },
      error: null,
    })
    const result = await createProfessionalLogic({ name: 'Ana Silva' })
    expect(result.success).toBe(true)
  })

  it('retorna success com nome e bio', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'professional-uuid', name: 'Ana Silva' },
      error: null,
    })
    const result = await createProfessionalLogic({ name: 'Ana Silva', bio: 'Especialista em coloração' })
    expect(result.success).toBe(true)
  })
})

describe('updateProfessionalLogic', () => {
  it('retorna validation_error se nome esta vazio', async () => {
    const result = await updateProfessionalLogic('professional-uuid', { name: '' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('validation_error')
  })

  it('retorna success quando dados validos', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'professional-uuid', name: 'Ana Silva' },
      error: null,
    })
    const result = await updateProfessionalLogic('professional-uuid', { name: 'Ana Silva' })
    expect(result.success).toBe(true)
  })
})

describe('toggleProfessionalLogic', () => {
  it('retorna success ao alternar status', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'professional-uuid', is_active: false },
      error: null,
    })
    const result = await toggleProfessionalLogic('professional-uuid', false)
    expect(result.success).toBe(true)
  })
})

describe('deleteProfessionalLogic', () => {
  it('retorna success ao deletar', async () => {
    const result = await deleteProfessionalLogic('professional-uuid')
    expect(result.success).toBe(true)
  })
})
