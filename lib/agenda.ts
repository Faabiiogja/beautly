import { addDays, toLocalDayAndTime, weekdayOf } from '@/lib/dates'
import type { AppointmentStatus } from '@/lib/appointment-status'

export type AgendaItem = {
  id: string
  status: AppointmentStatus
  service_name: string
  price_cents: number
  duration_minutes: number
  client_name: string
  client_phone: string
  start_time: string
  end_time: string
}

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// "Hoje", "Amanhã" ou "Segunda, 05/10" (com o ano quando não é o corrente).
export function dayLabel(day: string, today: string): string {
  if (day === today) return 'Hoje'
  if (day === addDays(today, 1)) return 'Amanhã'
  if (day === addDays(today, -1)) return 'Ontem'
  const [y, m, d] = day.split('-')
  const date = `${d}/${m}${y === today.slice(0, 4) ? '' : `/${y}`}`
  return `${WEEKDAYS[weekdayOf(day)]}, ${date}`
}

export type DayGroup = { day: string; label: string; items: AgendaItem[] }

// Agrupa pelo dia local de São Paulo (não o dia UTC), mantendo a ordem em que os itens chegam.
export function groupByDay(items: AgendaItem[], today: string): DayGroup[] {
  const groups: DayGroup[] = []
  for (const item of items) {
    const { day } = toLocalDayAndTime(new Date(item.start_time))
    const last = groups.at(-1)
    if (last?.day === day) last.items.push(item)
    else groups.push({ day, label: dayLabel(day, today), items: [item] })
  }
  return groups
}

// Linha do banco (colunas *_snapshot do agendamento) -> item da agenda.
export function toAgendaItem(row: {
  id: string
  status: AppointmentStatus
  service_name_snapshot: string
  price_cents_snapshot: number
  duration_minutes_snapshot: number
  client_name: string
  client_phone: string
  start_time: string
  end_time: string
}): AgendaItem {
  return {
    id: row.id,
    status: row.status,
    service_name: row.service_name_snapshot,
    price_cents: row.price_cents_snapshot,
    duration_minutes: row.duration_minutes_snapshot,
    client_name: row.client_name,
    client_phone: row.client_phone,
    start_time: row.start_time,
    end_time: row.end_time,
  }
}
