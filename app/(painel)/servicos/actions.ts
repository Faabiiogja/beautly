'use server'

import { revalidatePath } from 'next/cache'
import { requirePanelSession } from '@/lib/auth/dal'
import { isUuid } from '@/lib/ids'
import { validateService, type ServiceErrors } from '@/lib/services'
import { createClient } from '@/lib/supabase/server'

export type ServiceFormState = {
  error?: string
  fieldErrors?: ServiceErrors
  values?: { name: string; price: string; duration: string }
  // muda a cada salvamento com sucesso: usado como `key` para limpar o formulário
  savedAt?: number
}

function readForm(formData: FormData) {
  return {
    name: String(formData.get('name') ?? ''),
    price: String(formData.get('price') ?? ''),
    duration: String(formData.get('duration') ?? ''),
  }
}

export async function createService(_prev: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  const tenant = await requirePanelSession()
  const values = readForm(formData)
  const parsed = validateService(values)
  if (!parsed.ok) return { fieldErrors: parsed.errors, values }

  // tenant_id vem da sessão, nunca do formulário
  const supabase = await createClient()
  const { error } = await supabase.from('services').insert({ tenant_id: tenant.id, ...parsed.value })
  if (error) return { error: 'Não foi possível salvar o serviço. Tente novamente.', values }

  revalidatePath('/servicos')
  return { savedAt: Date.now() }
}

export async function updateService(_prev: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  const tenant = await requirePanelSession()
  const values = readForm(formData)
  const id = String(formData.get('id') ?? '')
  const parsed = validateService(values)
  if (!parsed.ok) return { fieldErrors: parsed.errors, values }
  if (!isUuid(id)) return { error: 'Serviço não encontrado.', values }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .update(parsed.value)
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .select('id')
  if (error || !data?.length) return { error: 'Não foi possível salvar o serviço. Tente novamente.', values }

  revalidatePath('/servicos')
  return { savedAt: Date.now(), values }
}

export async function setServiceActive(formData: FormData): Promise<void> {
  const tenant = await requirePanelSession()
  const id = String(formData.get('id') ?? '')
  if (!isUuid(id)) return
  const active = formData.get('active') === 'true'

  const supabase = await createClient()
  await supabase.from('services').update({ active }).eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath('/servicos')
}
