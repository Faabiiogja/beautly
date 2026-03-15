import { describe, it, expect } from 'vitest'
import { extractTenantSlug, MARKETING_HOSTS } from '@/lib/tenant'

// Os testes do middleware validam a lógica de resolução de contexto
// que o middleware.ts executa. O NextRequest não é instanciado aqui —
// testamos as funções puras que o middleware usa.

describe('resolução de contexto — marketing', () => {
  it('beautly.cloud é host de marketing', () => {
    expect(MARKETING_HOSTS.has('beautly.cloud')).toBe(true)
  })

  it('www.beautly.cloud é host de marketing', () => {
    expect(MARKETING_HOSTS.has('www.beautly.cloud')).toBe(true)
  })

  it('extractTenantSlug retorna null para beautly.cloud', () => {
    expect(extractTenantSlug('beautly.cloud')).toBeNull()
  })

  it('extractTenantSlug retorna null para www.beautly.cloud', () => {
    expect(extractTenantSlug('www.beautly.cloud')).toBeNull()
  })
})

describe('resolução de contexto — super admin', () => {
  // Super admin é detectado pelo middleware por host === beautly.cloud + path /admin
  // tenant.ts retorna null para beautly.cloud — o middleware então checa o path

  it('beautly.cloud não é host de tenant', () => {
    expect(extractTenantSlug('beautly.cloud')).toBeNull()
  })

  it('www.beautly.cloud/admin NÃO é super admin — é marketing', () => {
    // www.beautly.cloud sempre é marketing, independente do path
    expect(MARKETING_HOSTS.has('www.beautly.cloud')).toBe(true)
    expect(extractTenantSlug('www.beautly.cloud')).toBeNull()
  })
})

describe('resolução de contexto — tenant', () => {
  it('demo.beautly.cloud retorna slug demo', () => {
    expect(extractTenantSlug('demo.beautly.cloud')).toBe('demo')
  })

  it('clinica.beautly.cloud retorna slug clinica', () => {
    expect(extractTenantSlug('clinica.beautly.cloud')).toBe('clinica')
  })
})

describe('resolução de contexto — dev e preview', () => {
  it('localhost usa fallback', () => {
    expect(extractTenantSlug('localhost', 'demo')).toBe('demo')
  })

  it('preview Vercel usa fallback', () => {
    expect(extractTenantSlug('beautly-git-feature-branch.vercel.app', 'demo')).toBe('demo')
  })
})
