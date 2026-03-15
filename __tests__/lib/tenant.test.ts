import { describe, it, expect } from 'vitest'
import { extractTenantSlug } from '@/lib/tenant'

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
