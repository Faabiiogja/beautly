import { describe, expect, it } from 'vitest'
import { canCancel, displayStatus } from '@/lib/appointment-status'

const base = { status: 'confirmed' as const, start_time: '2026-10-05T13:30:00.000Z', end_time: '2026-10-05T14:30:00.000Z' }
const before = new Date('2026-10-01T12:00:00Z')
const during = new Date('2026-10-05T14:00:00Z')
const after = new Date('2026-10-06T12:00:00Z')

describe('displayStatus', () => {
  it('confirmado futuro, já ocorrido e cancelado', () => {
    expect(displayStatus(base, before)).toBe('confirmed')
    expect(displayStatus(base, during)).toBe('confirmed') // em andamento ainda não terminou
    expect(displayStatus(base, after)).toBe('past')
    expect(displayStatus({ ...base, status: 'cancelled' }, before)).toBe('cancelled')
    expect(displayStatus({ ...base, status: 'cancelled' }, after)).toBe('cancelled')
  })
})

describe('canCancel', () => {
  it('só cancela confirmado que ainda não terminou', () => {
    expect(canCancel(base, before)).toBe(true)
    expect(canCancel(base, during)).toBe(true)
    expect(canCancel(base, after)).toBe(false)
    expect(canCancel({ ...base, status: 'cancelled' }, before)).toBe(false)
  })
})
