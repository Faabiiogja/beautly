import { describe, expect, it } from 'vitest'
import { validateEmail, validateNewPassword, validateLogin } from '@/lib/auth/validation'

describe('validateEmail', () => {
  it('aceita e-mail válido e normaliza', () => {
    expect(validateEmail('  Ana@Example.com ')).toEqual({ ok: true, value: 'ana@example.com' })
  })
  it('rejeita vazio e formato inválido', () => {
    expect(validateEmail('')).toMatchObject({ ok: false })
    expect(validateEmail('ana@')).toMatchObject({ ok: false })
    expect(validateEmail('ana example.com')).toMatchObject({ ok: false })
  })
})

describe('validateLogin', () => {
  it('exige e-mail válido e senha preenchida', () => {
    expect(validateLogin('ana@example.com', 'segredo')).toEqual({ ok: true, email: 'ana@example.com', password: 'segredo' })
    expect(validateLogin('ana@example.com', '')).toMatchObject({ ok: false, errors: { password: expect.any(String) } })
    expect(validateLogin('x', 'segredo')).toMatchObject({ ok: false, errors: { email: expect.any(String) } })
  })
})

describe('validateNewPassword', () => {
  it('exige mínimo de 8 caracteres', () => {
    expect(validateNewPassword('curta', 'curta')).toMatchObject({ ok: false, errors: { password: expect.any(String) } })
  })
  it('exige confirmação igual', () => {
    expect(validateNewPassword('senhaforte1', 'senhaforte2')).toMatchObject({ ok: false, errors: { confirm: expect.any(String) } })
  })
  it('aceita senha válida confirmada', () => {
    expect(validateNewPassword('senhaforte1', 'senhaforte1')).toEqual({ ok: true, password: 'senhaforte1' })
  })
})
