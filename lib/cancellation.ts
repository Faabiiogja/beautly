import 'server-only'
import { isUuid } from '@/lib/ids'
import { createAnonClient } from '@/lib/supabase/anon'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export type CancelResult =
  // cancelado agora (changed) ou já estava cancelado (repetir não faz mal, e não deve avisar de novo)
  | { status: 'cancelled'; changed: boolean; tenantId: string }
  | { status: 'already_happened' }
  | { status: 'not_found' }

// Cancela pelo token do link, restrito ao tenant do subdomínio da requisição. `not_found` é a mesma
// resposta para token malformado/inexistente, de outro tenant ou de tenant inativo.
// A atualização é condicional (só confirmado que ainda não terminou), então não há corrida entre
// "ler o estado" e "cancelar". Cancelar libera o horário na hora: a exclusion constraint só vale
// para status = 'confirmed'.
export async function cancelByToken(subdomain: string, token: string, now: Date = new Date()): Promise<CancelResult> {
  if (!isUuid(token)) return { status: 'not_found' }

  const { data: tenant } = await createAnonClient().from('tenants').select('id').eq('subdomain', subdomain).maybeSingle()
  if (!tenant) return { status: 'not_found' }

  const supabase = createServiceRoleClient()
  const { data: updated, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', cancelled_at: now.toISOString() })
    .eq('tenant_id', tenant.id)
    .eq('token', token)
    .eq('status', 'confirmed')
    .gt('end_time', now.toISOString())
    .select('id')
  if (error) throw error
  if (updated.length > 0) return { status: 'cancelled', changed: true, tenantId: tenant.id }

  // Nada foi atualizado: descobre por quê.
  const { data: current, error: readError } = await supabase
    .from('appointments')
    .select('status')
    .eq('tenant_id', tenant.id)
    .eq('token', token)
    .maybeSingle()
  if (readError) throw readError
  if (!current) return { status: 'not_found' }
  return current.status === 'cancelled' ? { status: 'cancelled', changed: false, tenantId: tenant.id } : { status: 'already_happened' }
}
