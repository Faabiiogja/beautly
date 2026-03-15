import { describe, expect, it } from 'vitest'
import { filterAvailableSlots, generateSlots } from '@/lib/availability'

describe('generateSlots', () => {
  it('gera slots corretos para um dia aberto', () => {
    const slots = generateSlots({
      openTime: '09:00',
      closeTime: '11:00',
      slotDurationMinutes: 60,
      dateInTz: new Date('2026-03-18T12:00:00.000Z'),
      timezone: 'America/Sao_Paulo',
    })

    expect(slots).toHaveLength(2)
    expect(slots[0]).toBe('2026-03-18T12:00:00.000Z')
    expect(slots[1]).toBe('2026-03-18T13:00:00.000Z')
  })

  it('retorna [] para dia fechado (openTime === closeTime)', () => {
    const slots = generateSlots({
      openTime: '09:00',
      closeTime: '09:00',
      slotDurationMinutes: 60,
      dateInTz: new Date('2026-03-18T12:00:00.000Z'),
      timezone: 'America/Sao_Paulo',
    })

    expect(slots).toHaveLength(0)
  })

  it('nao gera slot se nao cabe antes do fechamento', () => {
    const slots = generateSlots({
      openTime: '09:00',
      closeTime: '09:30',
      slotDurationMinutes: 60,
      dateInTz: new Date('2026-03-18T12:00:00.000Z'),
      timezone: 'America/Sao_Paulo',
    })

    expect(slots).toHaveLength(0)
  })
})

describe('filterAvailableSlots', () => {
  const slots = [
    '2026-03-18T12:00:00.000Z',
    '2026-03-18T13:00:00.000Z',
    '2026-03-18T14:00:00.000Z',
  ]

  it('remove slot ocupado por booking existente', () => {
    const bookings = [
      {
        starts_at: '2026-03-18T13:00:00.000Z',
        ends_at: '2026-03-18T14:00:00.000Z',
      },
    ]

    const result = filterAvailableSlots(
      slots,
      bookings,
      [],
      new Date('2026-03-17T00:00:00.000Z')
    )

    expect(result).not.toContain('2026-03-18T13:00:00.000Z')
    expect(result).toContain('2026-03-18T12:00:00.000Z')
    expect(result).toContain('2026-03-18T14:00:00.000Z')
  })

  it('remove slot coberto por schedule_block', () => {
    const blocks = [
      {
        start_at: '2026-03-18T12:00:00.000Z',
        end_at: '2026-03-18T13:30:00.000Z',
      },
    ]

    const result = filterAvailableSlots(
      slots,
      [],
      blocks,
      new Date('2026-03-17T00:00:00.000Z')
    )

    expect(result).not.toContain('2026-03-18T12:00:00.000Z')
    expect(result).not.toContain('2026-03-18T13:00:00.000Z')
    expect(result).toContain('2026-03-18T14:00:00.000Z')
  })

  it('remove slots no passado', () => {
    const result = filterAvailableSlots(
      slots,
      [],
      [],
      new Date('2026-03-19T00:00:00.000Z')
    )

    expect(result).toHaveLength(0)
  })

  it('mantem slots futuros sem conflito', () => {
    const result = filterAvailableSlots(
      slots,
      [],
      [],
      new Date('2026-03-18T11:00:00.000Z')
    )

    expect(result).toHaveLength(3)
  })
})
