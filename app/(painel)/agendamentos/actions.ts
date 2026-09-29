'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePanelSession } from '@/lib/auth/dal'
import { isUuid } from '@/lib/ids'
import { createClient } from '@/lib/supabase/server'
import { AVISO } from './avisos'

// Cancela um agendamento do próprio tenant. Só o que está confirmado e ainda não terminou (mesma regra
// do link da cliente). tenant_id vem da sessão; o RLS repete a restrição. Cancelar libera o horário na hora:
// a exclusion constraint só vale para status = 'confirmed'.
export async function cancelAppointment(formData: FormData): Promise<void> {
  const tenant = await requirePanelSession()
  const id = String(formData.get('id') ?? '')
  if (!isUuid(id)) return

  const now = new Date().toISOString()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', cancelled_at: now })
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .eq('status', 'confirmed')
    .gt('end_time', now)
    .select('id')

  // Erro do banco ou nada para cancelar (já cancelado, já passou, id de outro tenant): avisa a profissional
  // em vez de parecer que deu certo.
  if (error || !data?.length) redirect(`/agendamentos?aviso=${AVISO.notCancelled}`)
  revalidatePath('/agendamentos')
  redirect(`/agendamentos?aviso=${AVISO.cancelled}`)
}
