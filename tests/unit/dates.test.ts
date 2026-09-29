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

import { addDays, dayBoundsUtc, localToUtc, weekdayOf } from '@/lib/dates'

describe('localToUtc', () => {
  it('converte horário local de São Paulo para o instante UTC (UTC-3)', () => {
    expect(localToUtc('2026-09-29', 9 * 60).toISOString()).toBe('2026-09-29T12:00:00.000Z')
    expect(localToUtc('2026-09-29', 0).toISOString()).toBe('2026-09-29T03:00:00.000Z')
    expect(localToUtc('2026-09-29', 23 * 60 + 30).toISOString()).toBe('2026-09-30T02:30:00.000Z')
  })

  it('respeita o horário de verão histórico (UTC-2), sem assumir offset fixo', () => {
    expect(localToUtc('2017-12-01', 9 * 60).toISOString()).toBe('2017-12-01T11:00:00.000Z')
    // o verão terminou em 18/02/2018: 20/02 já é UTC-3
    expect(localToUtc('2018-02-20', 9 * 60).toISOString()).toBe('2018-02-20T12:00:00.000Z')
  })
})

describe('dayBoundsUtc', () => {
  it('o dia local vai de 03:00Z a 03:00Z do dia seguinte, não de meia-noite UTC', () => {
    const { start, end } = dayBoundsUtc('2026-09-29')
    expect(start.toISOString()).toBe('2026-09-29T03:00:00.000Z')
    expect(end.toISOString()).toBe('2026-09-30T03:00:00.000Z')
  })

  it('um instante às 02:30Z ainda pertence ao dia local anterior', () => {
    const instant = new Date('2026-09-30T02:30:00Z')
    const d29 = dayBoundsUtc('2026-09-29')
    const d30 = dayBoundsUtc('2026-09-30')
    expect(instant >= d29.start && instant < d29.end).toBe(true)
    expect(instant >= d30.start && instant < d30.end).toBe(false)
  })
})

describe('addDays e weekdayOf', () => {
  it('soma dias atravessando mês e ano', () => {
    expect(addDays('2026-09-29', 1)).toBe('2026-09-30')
    expect(addDays('2026-09-29', 2)).toBe('2026-10-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('dia da semana com 0 = domingo', () => {
    expect(weekdayOf('2026-09-29')).toBe(2) // terça
    expect(weekdayOf('2026-09-27')).toBe(0) // domingo
  })
})

import { dayChipParts } from '@/lib/dates'

describe('dayChipParts', () => {
  it('abreviações em português para o carrossel de dias', () => {
    expect(dayChipParts('2026-09-29')).toEqual({ weekday: 'Ter', dayNumber: '29', month: 'Set' })
    expect(dayChipParts('2026-10-04')).toEqual({ weekday: 'Dom', dayNumber: '4', month: 'Out' })
  })
})

import { isRealDay } from '@/lib/dates'

describe('isRealDay', () => {
  it('aceita datas de calendário reais', () => {
    expect(isRealDay('2026-09-29')).toBe(true)
    expect(isRealDay('2028-02-29')).toBe(true) // ano bissexto
  })
  it('rejeita datas inexistentes e formatos errados', () => {
    expect(isRealDay('2026-02-30')).toBe(false)
    expect(isRealDay('2027-02-29')).toBe(false)
    expect(isRealDay('2026-13-01')).toBe(false)
    expect(isRealDay('29/09/2026')).toBe(false)
    expect(isRealDay('')).toBe(false)
  })
})
