import { describe, expect, it } from 'vitest'
import { extractSubdomain } from '@/lib/subdomain'

const ROOT = 'beautly.cloud'

describe('extractSubdomain', () => {
  it('extrai o subdomínio de um tenant', () => {
    expect(extractSubdomain('ana.beautly.cloud', ROOT)).toBe('ana')
    expect(extractSubdomain('ana-maria.beautly.cloud', ROOT)).toBe('ana-maria')
  })

  it('ignora porta e caixa', () => {
    expect(extractSubdomain('Ana.Beautly.Cloud:443', ROOT)).toBe('ana')
  })

  it('retorna null para o apex e para www', () => {
    expect(extractSubdomain('beautly.cloud', ROOT)).toBeNull()
    expect(extractSubdomain('www.beautly.cloud', ROOT)).toBeNull()
  })

  it('retorna null para subdomínios reservados (painel)', () => {
    expect(extractSubdomain('painel.beautly.cloud', ROOT)).toBeNull()
  })

  it('retorna null para hosts fora do domínio raiz', () => {
    expect(extractSubdomain('beautly-git-main.vercel.app', ROOT)).toBeNull()
    expect(extractSubdomain('evilbeautly.cloud', ROOT)).toBeNull()
    expect(extractSubdomain('ana.beautly.cloud.evil.com', ROOT)).toBeNull()
  })

  it('não trata subdomínios aninhados como tenant', () => {
    expect(extractSubdomain('a.b.beautly.cloud', ROOT)).toBeNull()
  })

  it('aceita FQDN com ponto final e rejeita rótulos inválidos', () => {
    expect(extractSubdomain('ana.beautly.cloud.', ROOT)).toBe('ana')
    expect(extractSubdomain('a_b.beautly.cloud', ROOT)).toBeNull()
    expect(extractSubdomain('-ana.beautly.cloud', ROOT)).toBeNull()
  })

  it('funciona em desenvolvimento com localhost', () => {
    expect(extractSubdomain('ana.localhost:3000', 'localhost')).toBe('ana')
    expect(extractSubdomain('localhost:3000', 'localhost')).toBeNull()
  })

  it('retorna null se o host estiver ausente', () => {
    expect(extractSubdomain(null, ROOT)).toBeNull()
  })
})

describe('subdomínios reservados', () => {
  it('espelham a constraint subdomain_not_reserved do schema', async () => {
    const { readFileSync } = await import('node:fs')
    const sql = readFileSync('supabase/migrations/20260929000000_init.sql', 'utf8')
    const block = sql.match(/subdomain not in \(([\s\S]*?)\)/)![1]
    const reserved = [...block.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1])
    expect(reserved.length).toBeGreaterThan(0)
    for (const name of reserved) {
      expect(extractSubdomain(`${name}.beautly.cloud`, ROOT)).toBeNull()
    }
  })
})
