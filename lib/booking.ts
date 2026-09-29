import 'server-only'
import { resolveBookable, slotsFor } from '@/lib/availability-data'
import { bookingWindow, type BookingValue } from '@/lib/booking-validation'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export type BookingResult =
  | { status: 'created'; token: string }
  | { status: 'slot_taken' }
  | { status: 'limit_reached' }
  | { status: 'not_found' }

// Postgres: 23P01 = violação da exclusion constraint (ADR 0002); 40P01 = deadlock detectado, que
// aparece no lugar dela quando duas inserções concorrem pelo mesmo horário. Para a cliente é o mesmo caso.
const SLOT_TAKEN_CODES = new Set(['23P01', '40P01'])
// SQLSTATE próprio da trigger do teto de 3 agendamentos futuros por telefone (migration client_booking_limit)
const LIMIT_REACHED_CODE = 'BK001'

// Cria o agendamento de UM serviço. O tenant vem sempre do subdomínio da requisição.
// 1) o horário precisa estar entre os oferecidos agora (expediente, bloqueios, grade, janela e passado);
// 2) a constraint do banco decide de vez a corrida entre clientes: quem confirmar primeiro leva.
export async function createBooking(input: BookingValue & { subdomain: string }, now: Date = new Date()): Promise<BookingResult> {
  const bookable = await resolveBookable(input.subdomain, input.serviceId)
  if (!bookable) return { status: 'not_found' }
  const { tenantId, service } = bookable

  const slots = await slotsFor({ tenantId, durationMinutes: service.duration_minutes, day: input.day, now })
  const time = `${String(Math.floor(input.minutes / 60)).padStart(2, '0')}:${String(input.minutes % 60).padStart(2, '0')}`
  if (!slots.includes(time)) return { status: 'slot_taken' }

  const { start, end } = bookingWindow(input.day, input.minutes, service.duration_minutes)
  const { data, error } = await createServiceRoleClient()
    .from('appointments')
    .insert({
      tenant_id: tenantId,
      service_id: service.id,
      // snapshot: editar ou inativar o serviço depois não altera este agendamento
      service_name_snapshot: service.name,
      price_cents_snapshot: service.price_cents,
      duration_minutes_snapshot: service.duration_minutes,
      client_name: input.name,
      client_phone: input.phone,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    })
    .select('token')
    .single()

  if (error) {
    if (SLOT_TAKEN_CODES.has(error.code)) return { status: 'slot_taken' }
    if (error.code === LIMIT_REACHED_CODE) return { status: 'limit_reached' }
    throw error
  }
  return { status: 'created', token: data.token }
}
