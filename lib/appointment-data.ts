import 'server-only'
import { isUuid } from '@/lib/ids'
import { createAnonClient } from '@/lib/supabase/anon'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export type AppointmentView = {
  status: 'confirmed' | 'cancelled'
  service_name: string
  price_cents: number
  duration_minutes: number
  client_name: string
  start_time: string
  end_time: string
  business: { business_name: string; phone: string; address: string | null }
}

// Agendamento pelo token do link, restrito ao tenant do subdomínio da requisição.
// null para token malformado/inexistente, de outro tenant ou de tenant inativo: mesma resposta em todos
// os casos, para o link não revelar nada. Devolve só o que a própria cliente precisa ver.
export async function loadAppointment(subdomain: string, token: string): Promise<AppointmentView | null> {
  if (!isUuid(token)) return null

  const { data: tenant } = await createAnonClient()
    .from('tenants')
    .select('id, business_name, phone, address')
    .eq('subdomain', subdomain)
    .maybeSingle()
  if (!tenant) return null

  const { data } = await createServiceRoleClient()
    .from('appointments')
    .select('status, service_name_snapshot, price_cents_snapshot, duration_minutes_snapshot, client_name, start_time, end_time')
    .eq('tenant_id', tenant.id)
    .eq('token', token)
    .maybeSingle()
  if (!data) return null

  return {
    status: data.status,
    service_name: data.service_name_snapshot,
    price_cents: data.price_cents_snapshot,
    duration_minutes: data.duration_minutes_snapshot,
    client_name: data.client_name,
    start_time: data.start_time,
    end_time: data.end_time,
    business: { business_name: tenant.business_name, phone: tenant.phone, address: tenant.address },
  }
}
