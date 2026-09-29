import { describe, expect, it } from 'vitest'
import { computeSlots, groupSlots, isDayOpen, MAX_DAYS_AHEAD, type WorkingHoursRow } from '@/lib/availability'

const TODAY = '2026-09-29' // terça
const NOW = new Date('2026-09-29T11:00:00Z') // 08:00 em São Paulo

const weekdays = (start: string, end: string): WorkingHoursRow[] =>
  [1, 2, 3, 4, 5].map((weekday) => ({ weekday, closed: false, start_time: start, end_time: end }))
const HOURS = [...weekdays('09:00:00', '18:00:00'), { weekday: 0, closed: true, start_time: null, end_time: null }]
const busy = (startZ: string, endZ: string) => ({ start: new Date(startZ), end: new Date(endZ) })

const slots = (over: Partial<Parameters<typeof computeSlots>[0]> = {}) =>
  computeSlots({ day: TODAY, now: NOW, durationMinutes: 60, workingHours: HOURS, blockedDays: [], busy: [], ...over })

describe('computeSlots: grade e expediente', () => {
  it('oferece a grade de 30 min em que o serviço cabe no expediente', () => {
    const r = slots()
    expect(r[0]).toBe('09:00')
    expect(r.at(-1)).toBe('17:00') // 17:00 + 60 min = 18:00, ainda cabe
    expect(r).toHaveLength(17)
  })

  it('serviço maior reduz o último horário', () => {
    expect(slots({ durationMinutes: 90 }).at(-1)).toBe('16:30')
    expect(slots({ durationMinutes: 30 }).at(-1)).toBe('17:30')
  })

  it('duração fora da grade (45 min) continua começando em :00 ou :30', () => {
    const r = slots({ durationMinutes: 45 })
    expect(r.at(-1)).toBe('17:00') // 17:30 + 45 min passaria das 18:00
    expect(r.every((s) => s.endsWith(':00') || s.endsWith(':30'))).toBe(true)
  })

  it('expediente que não começa na grade só oferece a partir do próximo :00/:30', () => {
    const r = slots({ workingHours: weekdays('09:15:00', '12:00:00'), durationMinutes: 30 })
    expect(r).toEqual(['09:30', '10:00', '10:30', '11:00', '11:30'])
  })

  it('serviço mais longo que o expediente não tem horário', () => {
    expect(slots({ workingHours: weekdays('09:00:00', '10:00:00'), durationMinutes: 90 })).toEqual([])
  })
})

describe('computeSlots: dias sem atendimento', () => {
  it('dia fechado, sem linha de expediente e dia bloqueado não têm horários', () => {
    expect(slots({ day: '2026-09-27' })).toEqual([]) // domingo fechado
    expect(slots({ day: '2026-10-03' })).toEqual([]) // sábado sem linha = fechado
    expect(slots({ blockedDays: [TODAY] })).toEqual([])
  })
})

describe('computeSlots: colisão com agendamentos confirmados', () => {
  // 10:00-11:00 local = 13:00Z-14:00Z
  const b = busy('2026-09-29T13:00:00Z', '2026-09-29T14:00:00Z')

  it('remove todo horário que se sobreponha ao agendamento', () => {
    const r = slots({ busy: [b] })
    expect(r).not.toContain('09:30') // 09:30-10:30 invade o das 10:00
    expect(r).not.toContain('10:00')
    expect(r).not.toContain('10:30')
  })

  it('horários colados (terminam quando o outro começa) continuam livres', () => {
    const r = slots({ busy: [b] })
    expect(r).toContain('09:00') // 09:00-10:00 termina quando o outro começa
    expect(r).toContain('11:00') // começa quando o outro termina
  })

  it('agendamentos de outro dia não interferem', () => {
    expect(slots({ busy: [busy('2026-09-30T13:00:00Z', '2026-09-30T14:00:00Z')] })).toEqual(slots())
  })
})

describe('computeSlots: hoje, passado e janela de 30 dias', () => {
  it('hoje só oferece horários a partir de agora, sem antecedência mínima', () => {
    const at = (iso: string) => slots({ now: new Date(iso) })[0]
    expect(at('2026-09-29T16:10:00Z')).toBe('13:30') // 13:10 local -> próximo horário da grade
    expect(at('2026-09-29T16:30:00Z')).toBe('13:30') // exatamente agora ainda vale
    expect(at('2026-09-29T16:31:00Z')).toBe('14:00')
  })

  it('depois do último horário do dia não sobra nada', () => {
    expect(slots({ now: new Date('2026-09-29T21:00:00Z') })).toEqual([]) // 18:00 local
  })

  it('dias passados não têm horários', () => {
    expect(slots({ day: '2026-09-28' })).toEqual([])
  })

  it('a janela vai até hoje + 30 dias, inclusive', () => {
    expect(MAX_DAYS_AHEAD).toBe(30)
    const inWindow = '2026-10-29' // quinta, hoje + 30
    const outside = '2026-10-30' // sexta, hoje + 31
    expect(slots({ day: inWindow }).length).toBeGreaterThan(0)
    expect(slots({ day: outside })).toEqual([])
  })
})

describe('computeSlots: virada do dia em São Paulo', () => {
  it('"hoje" é a data local: às 23:30 locais (02:30Z) ainda é o dia anterior em UTC+0', () => {
    const late = new Date('2026-09-30T02:30:00Z') // 23:30 de 29/09 em SP
    const hours = weekdays('20:00:00', '23:59:00')
    // 29/09 ainda é hoje: só resta um horário de 30 min que caiba (23:30-00:00 não cabe até 23:59)
    expect(computeSlots({ day: '2026-09-29', now: late, durationMinutes: 30, workingHours: hours, blockedDays: [], busy: [] })).toEqual([])
    // 30/09 é amanhã e tem a grade toda
    expect(computeSlots({ day: '2026-09-30', now: late, durationMinutes: 30, workingHours: hours, blockedDays: [], busy: [] })[0]).toBe('20:00')
  })

  it('agendamento às 23:00-00:00 locais bloqueia 23:00 do dia certo, e não o do dia seguinte', () => {
    const hours = weekdays('22:00:00', '23:59:00')
    const b = busy('2026-09-30T02:00:00Z', '2026-09-30T03:00:00Z') // 23:00-00:00 local de 29/09
    const base = { now: new Date('2026-09-29T11:00:00Z'), durationMinutes: 30, workingHours: hours, blockedDays: [], busy: [b] }
    expect(computeSlots({ ...base, day: '2026-09-29' })).toEqual(['22:00', '22:30'])
    expect(computeSlots({ ...base, day: '2026-09-30' })).toEqual(['22:00', '22:30', '23:00'])
  })
})

describe('isDayOpen', () => {
  it('usa expediente e bloqueios, dentro da janela', () => {
    expect(isDayOpen('2026-09-29', TODAY, HOURS, [])).toBe(true)
    expect(isDayOpen('2026-09-27', TODAY, HOURS, [])).toBe(false)
    expect(isDayOpen('2026-09-30', TODAY, HOURS, ['2026-09-30'])).toBe(false)
    expect(isDayOpen('2026-09-28', TODAY, HOURS, [])).toBe(false) // passado
    expect(isDayOpen('2026-10-30', TODAY, HOURS, [])).toBe(false) // fora da janela
  })
})

describe('groupSlots', () => {
  it('agrupa em manhã, tarde e noite e omite períodos vazios', () => {
    expect(groupSlots(['09:00', '11:30', '12:00', '17:30', '18:00', '19:30'])).toEqual([
      { period: 'Manhã', slots: ['09:00', '11:30'] },
      { period: 'Tarde', slots: ['12:00', '17:30'] },
      { period: 'Noite', slots: ['18:00', '19:30'] },
    ])
    expect(groupSlots(['14:00'])).toEqual([{ period: 'Tarde', slots: ['14:00'] }])
    expect(groupSlots([])).toEqual([])
  })
})

import { buildDays } from '@/lib/availability'

describe('buildDays', () => {
  it('lista hoje + 30 dias marcando quais aceitam agendamento', () => {
    const days = buildDays(TODAY, HOURS, ['2026-09-30'])
    expect(days).toHaveLength(31)
    expect(days[0]).toEqual({ day: '2026-09-29', open: true }) // terça
    expect(days[1]).toEqual({ day: '2026-09-30', open: false }) // bloqueado
    expect(days[2]).toEqual({ day: '2026-10-01', open: true })
    expect(days[5]).toEqual({ day: '2026-10-04', open: false }) // domingo
    expect(days.at(-1)?.day).toBe('2026-10-29')
  })
})
