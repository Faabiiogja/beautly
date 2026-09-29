import { PageHeader } from '@/components/panel/PageHeader'
import { requirePanelSession } from '@/lib/auth/dal'
import { formatPhone } from '@/lib/phone'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'beautly.cloud'

export default async function SettingsPage() {
  const tenant = await requirePanelSession()
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('subdomain, business_name, phone, address, description, logo_url')
    .eq('id', tenant.id)
    .single()
  if (!data) return null

  return (
    <main className="flex max-w-2xl flex-col gap-8">
      <PageHeader title="Configurações" subtitle="Os dados que suas clientes veem na sua página." />

      <p className="rounded-card bg-brand-tint px-4 py-3 text-sm text-primary">
        Seu link para compartilhar: <strong>{data.subdomain}.{ROOT_DOMAIN}</strong>
      </p>

      <section className="rounded-panel bg-card p-6 shadow-soft">
        <SettingsForm
          defaults={{
            business_name: data.business_name,
            phone: formatPhone(data.phone),
            address: data.address ?? '',
            description: data.description ?? '',
            logo_url: data.logo_url,
          }}
        />
      </section>
    </main>
  )
}
