import { describe, expect, it } from 'vitest'
import { formatLongDate, todayInSaoPaulo } from '@/lib/dates'

describe('todayInSaoPaulo', () => {
  it('usa a data local (UTC-3), não a UTC', () => {
    // 02:00 UTC de 30/09 ainda é 23:00 de 29/09 em São Paulo
    expect(todayInSaoPaulo(new Date('2026-09-30T02:00:00Z'))).toBe('2026-09-29')
    expect(todayInSaoPaulo(new Date('2026-09-30T03:00:00Z'))).toBe('2026-09-30')
  })
})

describe('formatLongDate', () => {
  it('formata YYYY-MM-DD em português', () => {
    expect(formatLongDate('2026-12-25')).toBe('25/12/2026 (sexta-feira)')
  })
})
