import type { SupabaseClient } from '@supabase/supabase-js'
import { decidePanelAccess, type PanelAccess } from '@/lib/panel-access'

// Busca a usuária logada e o tenant dela (pela sessão, nunca pelo subdomínio) e decide o acesso.
// A policy "tenant owner full access" deixa a dona ler a própria linha mesmo se inativa.
export async function fetchPanelAccess(supabase: SupabaseClient): Promise<PanelAccess> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return decidePanelAccess(null, null)

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, active')
    .eq('id', user.id)
    .maybeSingle()
  return decidePanelAccess(user, tenant)
}
