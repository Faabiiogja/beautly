import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/tenant', () => ({
  getCurrentTenant: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { getAdminSession, requireAdmin } from '@/lib/admin/auth'

const mockTenant = {
  id: 'tenant-uuid',
  slug: 'demo',
  name: 'Studio Demo',
  status: 'active',
}

function makeMockSupabase(user: { id: string } | null, tenantUserRole: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: tenantUserRole ? { role: tenantUserRole } : null,
              error: null,
            }),
          }),
        }),
      }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getCurrentTenant).mockResolvedValue(mockTenant as never)
})

describe('getAdminSession', () => {
  it('retorna null se nao ha usuario autenticado', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      makeMockSupabase(null, null) as never
    )
    const result = await getAdminSession()
    expect(result).toBeNull()
  })

  it('retorna null se usuario nao pertence ao tenant', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      makeMockSupabase({ id: 'user-uuid' }, null) as never
    )
    const result = await getAdminSession()
    expect(result).toBeNull()
  })

  it('retorna null se tenant nao existe', async () => {
    vi.mocked(getCurrentTenant).mockResolvedValue(null)
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      makeMockSupabase({ id: 'user-uuid' }, 'owner') as never
    )
    const result = await getAdminSession()
    expect(result).toBeNull()
  })

  it('retorna sessao valida com userId, tenantId e role', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      makeMockSupabase({ id: 'user-uuid' }, 'owner') as never
    )
    const result = await getAdminSession()
    expect(result).toEqual({
      userId: 'user-uuid',
      tenantId: 'tenant-uuid',
      role: 'owner',
    })
  })
})

describe('requireAdmin', () => {
  it('redireciona para /admin/login se sessao invalida', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      makeMockSupabase(null, null) as never
    )
    await requireAdmin()
    expect(redirect).toHaveBeenCalledWith('/admin/login')
  })

  it('retorna sessao se autenticado', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      makeMockSupabase({ id: 'user-uuid' }, 'owner') as never
    )
    const result = await requireAdmin()
    expect(result?.userId).toBe('user-uuid')
  })
})
