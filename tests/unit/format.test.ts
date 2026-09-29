import { describe, expect, it } from 'vitest'
import { formatDuration, formatPrice } from '@/lib/format'

describe('formatPrice', () => {
  it('formata centavos em reais', () => {
    expect(formatPrice(5000).replace(/\s/g, ' ')).toBe('R$ 50,00')
    expect(formatPrice(12990).replace(/\s/g, ' ')).toBe('R$ 129,90')
    expect(formatPrice(0).replace(/\s/g, ' ')).toBe('R$ 0,00')
  })
})

describe('formatDuration', () => {
  it('usa minutos abaixo de uma hora', () => {
    expect(formatDuration(30)).toBe('30 min')
  })
  it('usa horas quando redondo e horas+minutos quando não', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(90)).toBe('1h30')
    expect(formatDuration(120)).toBe('2h')
  })
})
