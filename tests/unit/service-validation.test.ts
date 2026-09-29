import { describe, expect, it } from 'vitest'
import { formatPriceInput, parsePriceToCents, validateService } from '@/lib/services'

describe('parsePriceToCents', () => {
  it.each([
    ['50', 5000],
    ['50,00', 5000],
    ['50,5', 5050],
    ['129,90', 12990],
    ['R$ 85,00', 8500],
    ['1.234,56', 123456],
    ['0', 0],
    ['49.90', 4990],
  ])('%s -> %i', (input, cents) => {
    expect(parsePriceToCents(input)).toBe(cents)
  })

  it.each(['', 'abc', '-5', '10,999', '1,2,3', '99999999'])('rejeita %j', (input) => {
    expect(parsePriceToCents(input)).toBeNull()
  })
})

describe('formatPriceInput', () => {
  it('formata centavos para o campo do formulário', () => {
    expect(formatPriceInput(5000)).toBe('50,00')
    expect(formatPriceInput(12990)).toBe('129,90')
    expect(formatPriceInput(5)).toBe('0,05')
  })
})

describe('validateService', () => {
  it('aceita e normaliza', () => {
    expect(validateService({ name: '  Manicure ', price: '85,00', duration: '60' })).toEqual({
      ok: true,
      value: { name: 'Manicure', price_cents: 8500, duration_minutes: 60 },
    })
  })

  it('exige nome, preço válido e duração positiva inteira', () => {
    const r = validateService({ name: ' ', price: 'x', duration: '0' })
    expect(r).toMatchObject({ ok: false, errors: { name: expect.any(String), price: expect.any(String), duration: expect.any(String) } })
    expect(validateService({ name: 'A', price: '10', duration: '45,5' })).toMatchObject({ ok: false, errors: { duration: expect.any(String) } })
  })

  it('limita nome e duração', () => {
    expect(validateService({ name: 'x'.repeat(81), price: '10', duration: '30' })).toMatchObject({ ok: false, errors: { name: expect.any(String) } })
    expect(validateService({ name: 'A', price: '10', duration: '601' })).toMatchObject({ ok: false, errors: { duration: expect.any(String) } })
  })
})
