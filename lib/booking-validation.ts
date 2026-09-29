import { isRealDay, localToUtc } from '@/lib/dates'
import { isUuid } from '@/lib/ids'
import { normalizePhone } from '@/lib/phone'

const TIME = /^([01]\d|2[0-3]):(00|30)$/ // só a grade de 30 min
const MAX_NAME = 80

export type BookingInput = { serviceId: string; day: string; time: string; name: string; phone: string }
export type BookingValue = { serviceId: string; day: string; minutes: number; name: string; phone: string }
export type BookingErrors = { name?: string; phone?: string; form?: string }
export type BookingValidation = { ok: true; value: BookingValue } | { ok: false; errors: BookingErrors }

export function validateBooking(input: BookingInput): BookingValidation {
  const errors: BookingErrors = {}
  // sem caracteres de controle/formatação (\u0000 derruba o Postgres; bidi engana quem lê o nome no painel)
  const name = input.name.replace(/[\p{Cc}\p{Cf}]/gu, ' ').trim().replace(/\s+/g, ' ')
  const phone = normalizePhone(input.phone)

  if (!name) errors.name = 'Informe seu nome.'
  else if (name.length > MAX_NAME) errors.name = `Use no máximo ${MAX_NAME} caracteres.`
  if (!phone) errors.phone = 'Informe um telefone válido com DDD, como (11) 99999-0000.'
  if (!isUuid(input.serviceId) || !isRealDay(input.day) || !TIME.test(input.time)) errors.form = 'Escolha o serviço, a data e o horário novamente.'

  if (errors.name || errors.phone || errors.form || !phone) return { ok: false, errors }
  const minutes = Number(input.time.slice(0, 2)) * 60 + Number(input.time.slice(3, 5))
  return { ok: true, value: { serviceId: input.serviceId, day: input.day, minutes, name, phone } }
}

// Início e fim do atendimento como instantes UTC, a partir do horário local de São Paulo.
export function bookingWindow(day: string, minutes: number, durationMinutes: number) {
  return { start: localToUtc(day, minutes), end: localToUtc(day, minutes + durationMinutes) }
}
