import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractTenantSlug } from '@/lib/tenant'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: Function) => fn,
}))

describe('extractTenantSlug — marketing hosts', () => {
  it('retorna null para beautly.cloud (marketing)', () => {
    expect(extractTenantSlug('beautly.cloud')).toBeNull()
  })

  it('retorna null para www.beautly.cloud (marketing)', () => {
    expect(extractTenantSlug('www.beautly.cloud')).toBeNull()
  })

  it('retorna null para beautly.cloud com porta', () => {
    expect(extractTenantSlug('beautly.cloud:3000')).toBeNull()
  })
})

describe('extractTenantSlug — tenant subdomains', () => {
  it('extrai slug de subdomínio em produção', () => {
    expect(extractTenantSlug('clinica.beautly.cloud')).toBe('clinica')
  })

  it('extrai slug com hífen', () => {
    expect(extractTenantSlug('studio-beleza.beautly.cloud')).toBe('studio-beleza')
  })

  it('extrai slug ignorando porta', () => {
    expect(extractTenantSlug('demo.beautly.cloud:3000')).toBe('demo')
  })
})

describe('extractTenantSlug — dev e preview', () => {
  it('usa fallback padrão para localhost', () => {
    expect(extractTenantSlug('localhost')).toBe('demo')
  })

  it('usa fallback com porta para localhost', () => {
    expect(extractTenantSlug('localhost:3000')).toBe('demo')
  })

  it('usa fallback customizado para localhost', () => {
    expect(extractTenantSlug('localhost', 'meu-tenant')).toBe('meu-tenant')
  })

  it('usa fallback para 127.0.0.1', () => {
    expect(extractTenantSlug('127.0.0.1')).toBe('demo')
  })

  it('usa fallback para preview Vercel', () => {
    expect(extractTenantSlug('beautly-git-feature.vercel.app', 'demo')).toBe('demo')
  })

  it('não falha com host vazio', () => {
    expect(extractTenantSlug('', 'demo')).toBe('demo')
  })
})

describe('getServicesByTenantId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna serviços ativos do tenant ordenados por nome', async () => {
    const mockServices = [
      { id: '1', name: 'Corte', price: 50, duration_minutes: 30 },
      { id: '2', name: 'Manicure', price: 30, duration_minutes: 45 },
    ]
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockServices, error: null }),
    }
    vi.mocked(createSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue(mockQuery),
    } as any)

    const { getServicesByTenantId } = await import('@/lib/tenant')
    const result = await getServicesByTenantId('tenant-123')

    expect(result).toEqual(mockServices)
    expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'tenant-123')
    expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true)
    expect(mockQuery.order).toHaveBeenCalledWith('name')
  })

  it('retorna array vazio quando não há serviços', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(createSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue(mockQuery),
    } as any)

    const { getServicesByTenantId } = await import('@/lib/tenant')
    const result = await getServicesByTenantId('tenant-123')

    expect(result).toEqual([])
  })
})
