import { describe, expect, it } from 'vitest'
import { bookingWindow, validateBooking } from '@/lib/booking-validation'
import { maskPhone } from '@/lib/phone'

const UUID = '11111111-2222-3333-4444-555555555555'
const valid = { serviceId: UUID, day: '2026-10-05', time: '10:30', name: '  Maria   da Silva ', phone: '(11) 99999-0000' }

describe('validateBooking', () => {
  it('aceita e normaliza (nome sem espaços extras, telefone só com dígitos, horário em minutos)', () => {
    expect(validateBooking(valid)).toEqual({
      ok: true,
      value: { serviceId: UUID, day: '2026-10-05', minutes: 630, name: 'Maria da Silva', phone: '11999990000' },
    })
  })

  it('remove caracteres de controle e de formatação do nome', () => {
    const r = validateBooking({ ...valid, name: 'Ma\u0000ria\u202E da\tSilva\n' })
    expect(r).toMatchObject({ ok: true, value: { name: 'Ma ria da Silva' } })
    expect(validateBooking({ ...valid, name: '\u0000\u200B' })).toMatchObject({ ok: false, errors: { name: expect.any(String) } })
  })

  it('bloqueia telefone inválido', () => {
    expect(validateBooking({ ...valid, phone: '123' })).toMatchObject({ ok: false, errors: { phone: expect.any(String) } })
    expect(validateBooking({ ...valid, phone: '(11) 89999-0000' })).toMatchObject({ ok: false, errors: { phone: expect.any(String) } })
  })

  it('exige nome, com limite de tamanho', () => {
    expect(validateBooking({ ...valid, name: '   ' })).toMatchObject({ ok: false, errors: { name: expect.any(String) } })
    expect(validateBooking({ ...valid, name: 'x'.repeat(81) })).toMatchObject({ ok: false, errors: { name: expect.any(String) } })
  })

  it('rejeita serviço, data ou horário malformados (fora da grade de 30 min)', () => {
    for (const bad of [{ serviceId: 'x' }, { day: '2026-02-30' }, { time: '10:15' }, { time: '25:00' }, { time: '9:00' }]) {
      expect(validateBooking({ ...valid, ...bad })).toMatchObject({ ok: false, errors: { form: expect.any(String) } })
    }
  })
})

describe('bookingWindow', () => {
  it('início e fim em UTC a partir do horário local de São Paulo', () => {
    const { start, end } = bookingWindow('2026-10-05', 630, 60)
    expect(start.toISOString()).toBe('2026-10-05T13:30:00.000Z')
    expect(end.toISOString()).toBe('2026-10-05T14:30:00.000Z')
  })
})

describe('maskPhone', () => {
  it.each([
    ['', ''],
    ['1', '(1'],
    ['11', '(11'],
    ['119', '(11) 9'],
    ['1199999', '(11) 9999-9'],
    ['1199999000', '(11) 9999-9000'],
    ['11999990000', '(11) 99999-0000'],
    ['(11) 99999-0000', '(11) 99999-0000'],
    ['119999900001234', '(11) 99999-0000'],
    ['abc11', '(11'],
  ])('%j -> %j', (input, masked) => {
    expect(maskPhone(input)).toBe(masked)
  })

  it('fixo de 10 dígitos usa 4-4', () => {
    expect(maskPhone('1133334444')).toBe('(11) 3333-4444')
  })
})
