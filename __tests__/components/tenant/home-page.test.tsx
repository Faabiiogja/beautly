import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/tenant', () => ({
  getCurrentTenant: vi.fn(),
  getServicesByTenantId: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

import * as tenantLib from '@/lib/tenant'
import { TenantHomePage } from '@/components/tenant/home-page'

const mockTenant = {
  id: 'tenant-1',
  name: 'Studio Demo',
  slug: 'demo',
  logo_url: null,
  primary_color: '#ec4899',
  status: 'active',
  created_at: '',
  updated_at: '',
  monthly_price: 0,
  timezone: 'America/Sao_Paulo',
}

const mockServices = [
  { id: 's1', name: 'Corte', price: 50, duration_minutes: 30 },
  { id: 's2', name: 'Manicure', price: 30, duration_minutes: 45 },
]

describe('TenantHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza o nome do studio no hero', async () => {
    vi.mocked(tenantLib.getCurrentTenant).mockResolvedValue(mockTenant)
    vi.mocked(tenantLib.getServicesByTenantId).mockResolvedValue(mockServices)

    render(await TenantHomePage())

    expect(screen.getByRole('heading', { level: 1, name: /Studio Demo/i })).toBeInTheDocument()
  })

  it('renderiza a lista de serviços', async () => {
    vi.mocked(tenantLib.getCurrentTenant).mockResolvedValue(mockTenant)
    vi.mocked(tenantLib.getServicesByTenantId).mockResolvedValue(mockServices)

    render(await TenantHomePage())

    expect(screen.getByText('Corte')).toBeInTheDocument()
    expect(screen.getByText('Manicure')).toBeInTheDocument()
  })

  it('renderiza estado vazio quando não há serviços', async () => {
    vi.mocked(tenantLib.getCurrentTenant).mockResolvedValue(mockTenant)
    vi.mocked(tenantLib.getServicesByTenantId).mockResolvedValue([])

    render(await TenantHomePage())

    expect(screen.getByText('Em breve')).toBeInTheDocument()
  })

  it('chama notFound() quando tenant não existe', async () => {
    vi.mocked(tenantLib.getCurrentTenant).mockResolvedValue(null)

    await expect(TenantHomePage()).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
