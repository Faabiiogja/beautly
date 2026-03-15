// __tests__/middleware.test.ts
import { describe, it, expect } from 'vitest'

// Extrai a lógica de resolução do slug para ser testável independentemente.
// O middleware.ts vai importar e usar essa função.
import { extractTenantSlug } from '@/lib/tenant'

describe('extractTenantSlug', () => {
  it('extrai slug de subdomínio em produção', () => {
    expect(extractTenantSlug('clinica.beautly.com')).toBe('clinica')
  })

  it('extrai slug de subdomínio com múltiplos segmentos', () => {
    expect(extractTenantSlug('studio-da-ana.beautly.com')).toBe('studio-da-ana')
  })

  it('retorna fallback para localhost', () => {
    expect(extractTenantSlug('localhost:3000', 'demo')).toBe('demo')
  })

  it('retorna fallback para localhost sem porta', () => {
    expect(extractTenantSlug('localhost', 'demo')).toBe('demo')
  })

  it('retorna fallback para preview Vercel', () => {
    expect(extractTenantSlug('beautly-git-feature-branch.vercel.app', 'demo')).toBe('demo')
  })

  it('retorna null para beautly.vercel.app (contexto marketing)', () => {
    expect(extractTenantSlug('beautly.vercel.app', 'demo')).toBeNull()
  })

  it('retorna null para admin.beautly.com (contexto super admin)', () => {
    expect(extractTenantSlug('admin.beautly.com')).toBeNull()
  })

  it('retorna fallback para 127.0.0.1', () => {
    expect(extractTenantSlug('127.0.0.1:3000', 'demo')).toBe('demo')
  })
})
