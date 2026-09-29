import 'server-only'
import { computeSlots, type BusyInterval } from '@/lib/availability'
import { dayBoundsUtc } from '@/lib/dates'
import { createAnonClient } from '@/lib/supabase/anon'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export type BookableService = { id: string; name: string; price_cents: number; duration_minutes: number }
export type Bookable = { tenantId: string; service: BookableService }

// Tenant ativo + serviço ativo dele, resolvidos pelo subdomínio (client anon, sob RLS).
// null é a mesma resposta para tenant inexistente, inativo ou serviço que não é dele.
export async function resolveBookable(subdomain: string, serviceId: string): Promise<Bookable | null> {
  const anon = createAnonClient()
  const { data: tenant } = await anon.from('tenants').select('id').eq('subdomain', subdomain).maybeSingle()
  if (!tenant) return null

  const { data: service } = await anon
    .from('services')
    .select('id, name, price_cents, duration_minutes')
    .eq('id', serviceId)
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .maybeSingle()
  return service ? { tenantId: tenant.id, service } : null
}

// Horários livres ("HH:MM") de um tenant num dia, para um serviço de certa duração.
// Expediente e bloqueios são públicos (anon). Só os agendamentos precisam da service role — e dela
// sai apenas o intervalo ocupado, nunca nome, telefone ou token.
export async function slotsFor(input: { tenantId: string; durationMinutes: number; day: string; now?: Date }): Promise<string[]> {
  const { tenantId, durationMinutes, day, now = new Date() } = input
  const anon = createAnonClient()

  const [{ data: workingHours, error: hoursError }, { data: blocked, error: blockedError }] = await Promise.all([
    anon.from('working_hours').select('weekday, closed, start_time, end_time').eq('tenant_id', tenantId),
    anon.from('blocked_days').select('day').eq('tenant_id', tenantId).eq('day', day),
  ])
  if (hoursError || blockedError) throw hoursError ?? blockedError

  // O "dia X" é o dia local de São Paulo, não o dia UTC.
  const { start, end } = dayBoundsUtc(day)
  const { data: appointments, error } = await createServiceRoleClient()
    .from('appointments')
    .select('start_time, end_time')
    .eq('tenant_id', tenantId)
    .eq('status', 'confirmed')
    .lt('start_time', end.toISOString())
    .gt('end_time', start.toISOString())
  if (error) throw error

  const busy: BusyInterval[] = (appointments ?? []).map((a) => ({ start: new Date(a.start_time), end: new Date(a.end_time) }))
  return computeSlots({
    day,
    now,
    durationMinutes,
    workingHours: workingHours ?? [],
    blockedDays: (blocked ?? []).map((b) => b.day),
    busy,
  })
}

export type SlotsResult = { status: 'ok'; slots: string[] } | { status: 'not_found' }

export async function loadSlots(input: { subdomain: string; serviceId: string; day: string; now?: Date }): Promise<SlotsResult> {
  const bookable = await resolveBookable(input.subdomain, input.serviceId)
  if (!bookable) return { status: 'not_found' }
  const slots = await slotsFor({ tenantId: bookable.tenantId, durationMinutes: bookable.service.duration_minutes, day: input.day, now: input.now })
  return { status: 'ok', slots }
}
