import { describe, expect, it } from 'vitest'
import { dayLabel, groupByDay, type AgendaItem } from '@/lib/agenda'

const item = (id: string, start: string, over: Partial<AgendaItem> = {}): AgendaItem => ({
  id,
  status: 'confirmed',
  service_name: 'Manicure',
  price_cents: 5000,
  duration_minutes: 60,
  client_name: 'Maria',
  client_phone: '11999990000',
  start_time: start,
  end_time: new Date(new Date(start).getTime() + 3_600_000).toISOString(),
  ...over,
})

describe('dayLabel', () => {
  const today = '2026-09-29'
  it('Ontem, Hoje e Amanhã', () => {
    expect(dayLabel('2026-09-28', today)).toBe('Ontem')
    expect(dayLabel('2026-09-29', today)).toBe('Hoje')
    expect(dayLabel('2026-09-30', today)).toBe('Amanhã')
  })
  it('outros dias: dia da semana e data', () => {
    expect(dayLabel('2026-10-05', today)).toBe('Segunda, 05/10')
    expect(dayLabel('2026-09-27', today)).toBe('Domingo, 27/09')
  })
  it('inclui o ano quando não é o ano corrente', () => {
    expect(dayLabel('2027-01-04', today)).toBe('Segunda, 04/01/2027')
  })
})

describe('groupByDay', () => {
  it('agrupa pelo dia LOCAL de São Paulo, mantendo a ordem recebida', () => {
    const items = [
      item('a', '2026-10-05T12:00:00Z'), // 09:00 do dia 05
      item('b', '2026-10-05T20:00:00Z'), // 17:00 do dia 05
      item('c', '2026-10-06T02:30:00Z'), // 23:30 do dia 05 (ainda dia 05 em SP)
      item('d', '2026-10-06T13:00:00Z'), // 10:00 do dia 06
    ]
    const groups = groupByDay(items, '2026-10-01')
    expect(groups.map((g) => [g.day, g.items.map((i) => i.id)])).toEqual([
      ['2026-10-05', ['a', 'b', 'c']],
      ['2026-10-06', ['d']],
    ])
    expect(groups[0].label).toBe('Segunda, 05/10')
  })

  it('lista vazia não gera grupos', () => {
    expect(groupByDay([], '2026-10-01')).toEqual([])
  })
})
