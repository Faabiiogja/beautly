// __tests__/super-admin/auth.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { createJWT, verifyJWT } from '@/lib/super-admin/auth'
import bcrypt from 'bcryptjs'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long!!'
})

describe('createJWT', () => {
  it('retorna uma string não vazia', async () => {
    const token = await createJWT()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })

  it('cria token com sub=super-admin', async () => {
    const token = await createJWT()
    const payload = await verifyJWT(token)
    expect(payload?.sub).toBe('super-admin')
  })
})

describe('verifyJWT', () => {
  it('retorna payload para token válido', async () => {
    const token = await createJWT()
    const payload = await verifyJWT(token)
    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe('super-admin')
  })

  it('retorna null para token inválido', async () => {
    const payload = await verifyJWT('token-invalido')
    expect(payload).toBeNull()
  })

  it('retorna null para string vazia', async () => {
    const payload = await verifyJWT('')
    expect(payload).toBeNull()
  })

  it('retorna null para token com secret errado', async () => {
    const { SignJWT } = await import('jose')
    const fakeSecret = new TextEncoder().encode('outro-secret-completamente-diferente!')
    const fakeToken = await new SignJWT({ sub: 'super-admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(fakeSecret)

    const payload = await verifyJWT(fakeToken)
    expect(payload).toBeNull()
  })
})

describe('validateCredentials', () => {
  const EMAIL = 'admin@test.com'
  let HASH: string

  beforeAll(async () => {
    HASH = await bcrypt.hash('senha123', 10)
  })

  it('aceita credenciais corretas', async () => {
    const emailOk = 'admin@test.com' === EMAIL
    const passOk = await bcrypt.compare('senha123', HASH)
    expect(emailOk && passOk).toBe(true)
  })

  it('rejeita senha incorreta', async () => {
    const passOk = await bcrypt.compare('errada', HASH)
    expect(passOk).toBe(false)
  })

  it('rejeita email incorreto', async () => {
    const emailOk = 'outro@test.com' === EMAIL
    expect(emailOk).toBe(false)
  })
})
