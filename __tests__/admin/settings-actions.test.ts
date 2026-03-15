import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

const mockEq = vi.fn()
const mockUpdate = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: () => ({ from: mockFrom }),
}))

import { requireAdmin } from '@/lib/admin/auth'
import { updateSettingsLogic } from '@/app/admin/(protected)/settings/actions'

const mockSession = {
  userId: 'user-uuid',
  tenantId: 'tenant-uuid',
  role: 'owner' as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireAdmin).mockResolvedValue(mockSession)
  mockEq.mockResolvedValue({ error: null })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ update: mockUpdate })
})

describe('updateSettingsLogic', () => {
  it('retorna validation_error se nome vazio', async () => {
    const result = await updateSettingsLogic({ name: '', primary_color: '#ec4899' })
    expect(result.error).toBe('validation_error')
  })

  it('retorna validation_error se cor nao e hex valido', async () => {
    const result = await updateSettingsLogic({ name: 'Studio', primary_color: 'pink' })
    expect(result.error).toBe('validation_error')
  })

  it('retorna validation_error se cor tem formato incorreto (#RGB)', async () => {
    const result = await updateSettingsLogic({ name: 'Studio', primary_color: '#ec4' })
    expect(result.error).toBe('validation_error')
  })

  it('retorna success quando dados validos', async () => {
    const result = await updateSettingsLogic({ name: 'Studio Demo', primary_color: '#ec4899' })
    expect(result.success).toBe(true)
  })
})
