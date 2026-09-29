import { addDays, localToUtc, todayInSaoPaulo, weekdayOf } from '@/lib/dates'
import type { WorkingHoursRow } from '@/lib/hours'

export const GRID_MINUTES = 30
export const MAX_DAYS_AHEAD = 30

export type { WorkingHoursRow }
export type BusyInterval = { start: Date; end: Date }

// "09:00:00" | "09:00" -> minutos desde a meia-noite
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
const toHhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

// Hoje até hoje + 30 dias, inclusive. Sem antecedência mínima.
const inWindow = (day: string, today: string) => day >= today && day <= addDays(today, MAX_DAYS_AHEAD)

// Dia sem linha de expediente conta como fechado.
function openHours(day: string, workingHours: WorkingHoursRow[]) {
  const row = workingHours.find((r) => r.weekday === weekdayOf(day))
  if (!row || row.closed || !row.start_time || !row.end_time) return null
  return { open: toMinutes(row.start_time), close: toMinutes(row.end_time) }
}

// O dia aceita agendamento em princípio? (janela, bloqueio e expediente; não considera lotação)
export function isDayOpen(day: string, today: string, workingHours: WorkingHoursRow[], blockedDays: string[]): boolean {
  return inWindow(day, today) && !blockedDays.includes(day) && openHours(day, workingHours) !== null
}

// Horários livres ("HH:MM", hora local de São Paulo) de um dia para um serviço.
// Grade fixa de 30 min alinhada a :00/:30; o serviço inteiro precisa caber no expediente e não pode
// se sobrepor a agendamento confirmado (`busy`, em instantes UTC). Horários colados são permitidos.
export function computeSlots(input: {
  day: string
  now: Date
  durationMinutes: number
  workingHours: WorkingHoursRow[]
  blockedDays: string[]
  busy: BusyInterval[]
}): string[] {
  const { day, now, durationMinutes, workingHours, blockedDays, busy } = input
  if (!isDayOpen(day, todayInSaoPaulo(now), workingHours, blockedDays)) return []
  const hours = openHours(day, workingHours)!

  const slots: string[] = []
  for (let minutes = Math.ceil(hours.open / GRID_MINUTES) * GRID_MINUTES; minutes + durationMinutes <= hours.close; minutes += GRID_MINUTES) {
    const start = localToUtc(day, minutes)
    const end = localToUtc(day, minutes + durationMinutes)
    if (start < now) continue
    if (busy.some((b) => start < b.end && b.start < end)) continue
    slots.push(toHhmm(minutes))
  }
  return slots
}

export type SlotGroup = { period: 'Manhã' | 'Tarde' | 'Noite'; slots: string[] }

// Períodos por hora de início: [from, to).
const PERIODS: { period: SlotGroup['period']; from: number; to: number }[] = [
  { period: 'Manhã', from: 0, to: 12 },
  { period: 'Tarde', from: 12, to: 18 },
  { period: 'Noite', from: 18, to: 24 },
]

export function groupSlots(slots: string[]): SlotGroup[] {
  return PERIODS.map(({ period, from, to }) => ({
    period,
    slots: slots.filter((slot) => {
      const hour = Number(slot.slice(0, 2))
      return hour >= from && hour < to
    }),
  })).filter((group) => group.slots.length > 0)
}

// Hoje + 30 dias para o seletor de datas, marcando os que aceitam agendamento.
export function buildDays(today: string, workingHours: WorkingHoursRow[], blockedDays: string[]): { day: string; open: boolean }[] {
  return Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => {
    const day = addDays(today, i)
    return { day, open: isDayOpen(day, today, workingHours, blockedDays) }
  })
}
