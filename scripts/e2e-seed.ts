// Semeia (de forma idempotente) o tenant de teste usado pelos testes Playwright contra o Supabase de
// staging. Rodar de novo é seguro: sempre deixa o tenant `e2e` no mesmo estado conhecido.
//
// Uso: node scripts/e2e-seed.ts (lê .env.e2e.local; ver README, seção E2E / Playwright)
import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'
import { join } from 'node:path'
import { loadEnvFile } from './env.ts'
import {
  E2E_SUBDOMAIN,
  E2E_EMAIL,
  E2E_PASSWORD,
  E2E_BUSINESS_NAME,
  E2E_ACTIVE_SERVICE_NAMES,
  E2E_INACTIVE_SERVICE_NAME,
} from './e2e-fixtures.ts'

const env = loadEnvFile(join(import.meta.dirname, '../.env.e2e.local'))
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const { SUPABASE_DB_PASSWORD, SUPABASE_DB_POOLER_HOST, SUPABASE_DB_POOLER_USER } = env
if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SUPABASE_DB_PASSWORD || !SUPABASE_DB_POOLER_HOST || !SUPABASE_DB_POOLER_USER) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_DB_PASSWORD / SUPABASE_DB_POOLER_HOST / SUPABASE_DB_POOLER_USER ausentes em .env.e2e.local',
  )
}

// Acha o id de um auth.users existente por e-mail direto no Postgres (via pooler), em vez da Admin API
// paginada (`listUsers`) — que exigiria varrer páginas conforme o staging acumula usuários e ainda
// assim erraria acima do limite escolhido. Só usada nesta consulta pontual; o resto do seed usa a
// Admin API normalmente (criar/atualizar usuário, tabelas via service role).
async function findUserIdByEmail(email: string): Promise<string | null> {
  const client = new Client({
    host: SUPABASE_DB_POOLER_HOST,
    port: 5432,
    user: SUPABASE_DB_POOLER_USER,
    password: SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  try {
    const { rows } = await client.query<{ id: string }>('select id from auth.users where email = $1', [email])
    return rows[0]?.id ?? null
  } finally {
    await client.end()
  }
}

async function seed() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

  // 1) usuário de Auth (id vira o id do tenant, ver ADR de isolamento multi-tenant)
  let userId: string
  const foundId = await findUserIdByEmail(E2E_EMAIL)
  if (foundId) {
    userId = foundId
    await admin.auth.admin.updateUserById(userId, { password: E2E_PASSWORD })
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
      email_confirm: true,
    })
    if (error || !data.user) throw error ?? new Error('createUser sem retorno')
    userId = data.user.id
  }

  // 2) tenant (upsert pelo id, que é fixo = userId)
  const { error: tenantError } = await admin.from('tenants').upsert(
    {
      id: userId,
      subdomain: E2E_SUBDOMAIN,
      business_name: E2E_BUSINESS_NAME,
      phone: '11987654321',
      address: 'Rua de Teste, 123',
      description: 'Tenant fixo usado pelos testes end-to-end. Não editar pelo painel.',
      active: true,
    },
    { onConflict: 'id' },
  )
  if (tenantError) throw tenantError

  // helper: delete que lança se falhar, pra nunca engolir erro em silêncio e deixar lixo acumular
  const del = async (table: 'appointments' | 'services' | 'working_hours' | 'blocked_days') => {
    const { error } = await admin.from(table).delete().eq('tenant_id', userId)
    if (error) throw error
  }

  // 3) primeiro os agendamentos: appointments.service_id referencia services com ON DELETE RESTRICT,
  // então precisa sumir antes de apagar os serviços, senão o delete de services abaixo falha.
  await del('appointments')

  // 4) serviços: apaga e recria, pra não acumular lixo de execuções anteriores
  await del('services')
  const { error: servicesError } = await admin.from('services').insert([
    { tenant_id: userId, name: E2E_ACTIVE_SERVICE_NAMES[0], price_cents: 12000, duration_minutes: 60, active: true },
    { tenant_id: userId, name: E2E_ACTIVE_SERVICE_NAMES[1], price_cents: 4500, duration_minutes: 45, active: true },
    { tenant_id: userId, name: E2E_INACTIVE_SERVICE_NAME, price_cents: 6000, duration_minutes: 30, active: false },
  ])
  if (servicesError) throw servicesError

  // 5) expediente: seg-sex 09:00-18:00, sáb 09:00-13:00, dom fechado (weekday 0 = domingo, padrão Postgres)
  await del('working_hours')
  const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    if (weekday === 0) return { tenant_id: userId, weekday, closed: true, start_time: null, end_time: null }
    if (weekday === 6) return { tenant_id: userId, weekday, closed: false, start_time: '09:00', end_time: '13:00' }
    return { tenant_id: userId, weekday, closed: false, start_time: '09:00', end_time: '18:00' }
  })
  const { error: hoursError } = await admin.from('working_hours').insert(hours)
  if (hoursError) throw hoursError

  // 6) sem dias bloqueados de execuções anteriores
  await del('blocked_days')

  console.log(`Seed ok: tenant "${E2E_SUBDOMAIN}" (id ${userId}), login ${E2E_EMAIL}`)
}

seed().catch((error) => {
  console.error('Falha ao semear o E2E:', error)
  process.exit(1)
})
