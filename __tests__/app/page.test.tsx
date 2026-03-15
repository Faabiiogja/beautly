import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

vi.mock('@/components/tenant/home-page', () => ({
  TenantHomePage: () => <div data-testid="tenant-home-page" />,
}))

vi.mock('@/app/_components/marketing/landing-page', () => ({
  BeautlyLandingPage: () => <div data-testid="marketing-landing-page" />,
}))

import { headers } from 'next/headers'
import RootPage from '@/app/page'

describe('RootPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza TenantHomePage quando x-context é tenant', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: (key: string) => (key === 'x-context' ? 'tenant' : null),
    } as any)

    render(await RootPage())

    expect(screen.getByTestId('tenant-home-page')).toBeInTheDocument()
    expect(screen.queryByTestId('marketing-landing-page')).not.toBeInTheDocument()
  })

  it('renderiza BeautlyLandingPage quando x-context é marketing', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: (key: string) => (key === 'x-context' ? 'marketing' : null),
    } as any)

    render(await RootPage())

    expect(screen.getByTestId('marketing-landing-page')).toBeInTheDocument()
    expect(screen.queryByTestId('tenant-home-page')).not.toBeInTheDocument()
  })

  it('renderiza BeautlyLandingPage quando x-context é null', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: () => null,
    } as any)

    render(await RootPage())

    expect(screen.getByTestId('marketing-landing-page')).toBeInTheDocument()
  })
})
