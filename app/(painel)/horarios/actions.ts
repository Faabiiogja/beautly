'use server'

import { revalidatePath } from 'next/cache'
import { requirePanelSession } from '@/lib/auth/dal'
import { isUuid } from '@/lib/ids'
import { todayInSaoPaulo } from '@/lib/dates'
import { validateBlockedDay, validateWeek, type DayInput } from '@/lib/hours'
import { createClient } from '@/lib/supabase/server'

export type WeekFormState = {
  error?: string
  errors?: Record<number, string>
  values?: DayInput[]
  savedAt?: number
}

export type BlockedDayState = { error?: string; savedAt?: number }

export async function saveWorkingHours(_prev: WeekFormState, formData: FormData): Promise<WeekFormState> {
  const tenant = await requirePanelSession()
  // weekday 0 = domingo (convenção do Postgres)
  const values: DayInput[] = Array.from({ length: 7 }, (_, d) => ({
    closed: formData.get(`closed_${d}`) === 'on',
    start: String(formData.get(`start_${d}`) ?? ''),
    end: String(formData.get(`end_${d}`) ?? ''),
  }))
  const parsed = validateWeek(values)
  if (!parsed.ok) return { errors: parsed.errors, values }

  const supabase = await createClient()
  const { error } = await supabase
    .from('working_hours')
    .upsert(parsed.rows.map((row) => ({ tenant_id: tenant.id, ...row })), { onConflict: 'tenant_id,weekday' })
  if (error) return { error: 'Não foi possível salvar o expediente. Tente novamente.', values }

  // Reduzir o expediente só afeta novos agendamentos: os já confirmados não são tocados aqui.
  revalidatePath('/horarios')
  return { savedAt: Date.now(), values }
}

export async function addBlockedDay(_prev: BlockedDayState, formData: FormData): Promise<BlockedDayState> {
  const tenant = await requirePanelSession()
  const parsed = validateBlockedDay(String(formData.get('day') ?? ''), todayInSaoPaulo())
  if (!parsed.ok) return { error: parsed.error }

  const supabase = await createClient()
  const { error } = await supabase.from('blocked_days').insert({ tenant_id: tenant.id, day: parsed.value })
  if (error) {
    return { error: error.code === '23505' ? 'Esse dia já está bloqueado.' : 'Não foi possível bloquear o dia. Tente novamente.' }
  }

  revalidatePath('/horarios')
  return { savedAt: Date.now() }
}

export async function removeBlockedDay(formData: FormData): Promise<void> {
  const tenant = await requirePanelSession()
  const id = String(formData.get('id') ?? '')
  if (!isUuid(id)) return

  const supabase = await createClient()
  await supabase.from('blocked_days').delete().eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath('/horarios')
}
