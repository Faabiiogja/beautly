import { describe, expect, it } from 'vitest'
import { DISPLAY_ORDER, defaultWeek, validateBlockedDay, validateWeek, type DayInput } from '@/lib/hours'

const open = (start: string, end: string): DayInput => ({ closed: false, start, end })
const closed: DayInput = { closed: true, start: '', end: '' }

describe('validateWeek', () => {
  it('aceita dias abertos e fechados', () => {
    const week: DayInput[] = [closed, open('09:00', '18:00'), open('09:00', '18:00'), open('09:00', '18:00'), open('09:00', '18:00'), open('09:00', '18:00'), open('09:00', '13:00')]
    const r = validateWeek(week)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.rows).toHaveLength(7)
      expect(r.rows[0]).toEqual({ weekday: 0, closed: true, start_time: null, end_time: null })
      expect(r.rows[6]).toEqual({ weekday: 6, closed: false, start_time: '09:00', end_time: '13:00' })
    }
  })

  it('exige início e fim em dia aberto, com início antes do fim', () => {
    const base = Array.from({ length: 7 }, () => closed)
    const bad = (i: number, d: DayInput) => validateWeek(base.map((x, j) => (j === i ? d : x)))
    expect(bad(2, open('', '18:00'))).toMatchObject({ ok: false, errors: { 2: expect.any(String) } })
    expect(bad(3, open('18:00', '09:00'))).toMatchObject({ ok: false, errors: { 3: expect.any(String) } })
    expect(bad(3, open('09:00', '09:00'))).toMatchObject({ ok: false })
    expect(bad(4, open('9h', '18:00'))).toMatchObject({ ok: false })
  })

  it('exige os 7 dias', () => {
    expect(validateWeek([closed])).toMatchObject({ ok: false })
  })
})

describe('defaultWeek e ordem de exibição', () => {
  it('sugere seg-sex 09-18 e sáb/dom fechados; índice 0 = domingo', () => {
    const w = defaultWeek()
    expect(w[0].closed).toBe(true)
    expect(w[6].closed).toBe(true)
    expect(w[1]).toEqual({ closed: false, start: '09:00', end: '18:00' })
  })
  it('exibe de segunda a domingo', () => {
    expect(DISPLAY_ORDER).toEqual([1, 2, 3, 4, 5, 6, 0])
  })
})

describe('validateBlockedDay', () => {
  const today = '2026-09-29'
  it('aceita hoje e datas futuras', () => {
    expect(validateBlockedDay('2026-09-29', today)).toEqual({ ok: true, value: '2026-09-29' })
    expect(validateBlockedDay('2026-12-25', today)).toEqual({ ok: true, value: '2026-12-25' })
  })
  it('rejeita passado, vazio e datas inexistentes', () => {
    expect(validateBlockedDay('2026-09-28', today)).toMatchObject({ ok: false })
    expect(validateBlockedDay('', today)).toMatchObject({ ok: false })
    expect(validateBlockedDay('2026-02-30', today)).toMatchObject({ ok: false })
    expect(validateBlockedDay('29/09/2026', today)).toMatchObject({ ok: false })
  })
})
