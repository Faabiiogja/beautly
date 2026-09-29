import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Ignora RLS. Só para rotas públicas de agendamento, que devem operar apenas no tenant
// resolvido pelo subdomínio da requisição — nunca aceitar tenant_id vindo do client.
export function createServiceRoleClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
