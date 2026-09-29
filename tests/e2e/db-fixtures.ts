// Helpers de banco pros specs que precisam de dados próprios (não compartilhados entre os projetos
// desktop/mobile, que rodam em paralelo contra o mesmo tenant de staging).
import { createClient } from '@supabase/supabase-js'
import { join } from 'node:path'
import { loadEnvFile } from '../../scripts/env'
import { E2E_ACTIVE_SERVICE_NAMES, E2E_SUBDOMAIN } from '../../scripts/e2e-fixtures'

const env = loadEnvFile(join(__dirname, '../../.env.e2e.local'))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Cria um agendamento confirmado no futuro para o tenant `e2e`, com o nome de cliente dado (deixe único
// por chamada — ex.: inclua o nome do projeto do Playwright — pra não colidir entre desktop e mobile).
export async function createCancelableAppointment(clientName: string): Promise<void> {
  const { data: tenant, error: tenantError } = await admin.from('tenants').select('id').eq('subdomain', E2E_SUBDOMAIN).single()
  if (tenantError) throw tenantError

  const { data: service, error: serviceError } = await admin
    .from('services')
    .select('id, name, price_cents, duration_minutes')
    .eq('tenant_id', tenant.id)
    .eq('name', E2E_ACTIVE_SERVICE_NAMES[0])
    .single()
  if (serviceError) throw serviceError

  // Data/hora aleatória numa janela larga no futuro: os projetos desktop/mobile do Playwright rodam
  // em paralelo contra o mesmo tenant, e a constraint de não-sobreposição rejeitaria dois inserts
  // exatamente no mesmo horário.
  const start = new Date()
  start.setUTCDate(start.getUTCDate() + 3 + Math.floor(Math.random() * 60))
  start.setUTCHours(Math.floor(Math.random() * 12), 0, 0, 0)
  const end = new Date(start.getTime() + service.duration_minutes * 60_000)

  const { error } = await admin.from('appointments').insert({
    tenant_id: tenant.id,
    service_id: service.id,
    service_name_snapshot: service.name,
    price_cents_snapshot: service.price_cents,
    duration_minutes_snapshot: service.duration_minutes,
    client_name: clientName,
    client_phone: '11987654321',
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    status: 'confirmed',
  })
  if (error) throw error
}
