import { describe, expect, it } from 'vitest'
import { isSameOrigin } from '@/lib/http'

describe('isSameOrigin', () => {
  it('aceita a própria origem, sem diferenciar maiúsculas, e a ausência do cabeçalho', () => {
    expect(isSameOrigin('https://ana.beautly.cloud', 'ana.beautly.cloud')).toBe(true)
    expect(isSameOrigin('HTTPS://ANA.beautly.cloud', 'ana.BEAUTLY.cloud')).toBe(true)
    expect(isSameOrigin('http://demo.localhost:3000', 'demo.localhost:3000')).toBe(true)
    expect(isSameOrigin(null, 'ana.beautly.cloud')).toBe(true)
  })
  it('recusa origem de outro site, "null", lixo e Host ausente', () => {
    expect(isSameOrigin('https://evil.example', 'ana.beautly.cloud')).toBe(false)
    expect(isSameOrigin('https://ana.beautly.cloud.evil.example', 'ana.beautly.cloud')).toBe(false)
    expect(isSameOrigin('null', 'ana.beautly.cloud')).toBe(false)
    expect(isSameOrigin('não é url', 'ana.beautly.cloud')).toBe(false)
    expect(isSameOrigin('https://ana.beautly.cloud', null)).toBe(false)
  })
})
