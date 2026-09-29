import 'server-only'
import { computeSlots, type BusyInterval } from '@/lib/availability'
import { dayBoundsUtc } from '@/lib/dates'
import { createAnonClient } from '@/lib/supabase/anon'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export type SlotsResult = { status: 'ok'; slots: string[] } | { status: 'not_found' }

// Horários livres de um serviço num dia, para a página pública de um tenant.
// Tenant, serviço, expediente e bloqueios são públicos (client anon, sob RLS). Só os agendamentos
// precisam da service role — e dela sai apenas o intervalo ocupado, nunca nome, telefone ou token.
// `not_found` é a mesma resposta para tenant inexistente, inativo ou serviço que não é dele.
export async function loadSlots(input: { subdomain: string; serviceId: string; day: string; now?: Date }): Promise<SlotsResult> {
  const { subdomain, serviceId, day, now = new Date() } = input
  const anon = createAnonClient()

  const { data: tenant } = await anon.from('tenants').select('id').eq('subdomain', subdomain).maybeSingle()
  if (!tenant) return { status: 'not_found' }

  const { data: service } = await anon
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .maybeSingle()
  if (!service) return { status: 'not_found' }

  const [{ data: workingHours, error: hoursError }, { data: blocked, error: blockedError }] = await Promise.all([
    anon.from('working_hours').select('weekday, closed, start_time, end_time').eq('tenant_id', tenant.id),
    anon.from('blocked_days').select('day').eq('tenant_id', tenant.id).eq('day', day),
  ])
  if (hoursError || blockedError) throw hoursError ?? blockedError

  // O "dia X" é o dia local de São Paulo, não o dia UTC.
  const { start, end } = dayBoundsUtc(day)
  const { data: appointments, error } = await createServiceRoleClient()
    .from('appointments')
    .select('start_time, end_time')
    .eq('tenant_id', tenant.id)
    .eq('status', 'confirmed')
    .lt('start_time', end.toISOString())
    .gt('end_time', start.toISOString())
  if (error) throw error

  const busy: BusyInterval[] = (appointments ?? []).map((a) => ({ start: new Date(a.start_time), end: new Date(a.end_time) }))
  const slots = computeSlots({
    day,
    now,
    durationMinutes: service.duration_minutes,
    workingHours: workingHours ?? [],
    blockedDays: (blocked ?? []).map((b) => b.day),
    busy,
  })
  return { status: 'ok', slots }
}
