import { requireAdmin } from '@/lib/admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { SettingsForm } from './_components/settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, primary_color')
    .eq('id', session.tenantId)
    .single()

  if (!tenant) return <p className="p-6 text-sm text-stone-500">Tenant não encontrado.</p>

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold tracking-[-0.03em] text-stone-900 mb-6">
        Configurações
      </h1>
      <SettingsForm name={tenant.name} primaryColor={tenant.primary_color ?? '#ec4899'} />
    </div>
  )
}
