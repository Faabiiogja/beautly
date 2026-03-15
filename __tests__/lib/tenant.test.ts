import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractTenantSlug } from '@/lib/tenant'

// getTenantBySlug e getCurrentTenant envolvem Supabase e next/cache —
// são testados no nível de integração via supabase db reset + seed.
// Aqui testamos apenas a lógica pura de extração de slug.

describe('extractTenantSlug — casos edge', () => {
  it('lida com host sem porta', () => {
    expect(extractTenantSlug('clinica.beautly.com')).toBe('clinica')
  })

  it('lida com subdomínio composto por hífen', () => {
    expect(extractTenantSlug('studio-beleza.beautly.com')).toBe('studio-beleza')
  })

  it('retorna null explícito para admin.beautly.com', () => {
    expect(extractTenantSlug('admin.beautly.com')).toBeNull()
  })

  it('usa fallback customizado para localhost', () => {
    expect(extractTenantSlug('localhost:3000', 'meu-tenant')).toBe('meu-tenant')
  })

  it('usa fallback padrão "demo" quando não fornecido', () => {
    expect(extractTenantSlug('localhost')).toBe('demo')
  })

  it('usa fallback para qualquer subdomínio .vercel.app', () => {
    expect(extractTenantSlug('beautly-abc123.vercel.app', 'demo')).toBe('demo')
  })

  it('não falha com host vazio', () => {
    expect(extractTenantSlug('', 'demo')).toBe('demo')
  })
})
