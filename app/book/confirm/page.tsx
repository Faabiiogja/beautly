import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { ConfirmForm } from './_components/confirm-form'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ serviceId?: string; professionalId?: string; slot?: string }>
}

export default async function ConfirmPage({ searchParams }: PageProps) {
  const { serviceId, professionalId, slot } = await searchParams

  if (!serviceId || !professionalId || !slot) {
    notFound()
  }

  const tenant = await getCurrentTenant()

  if (!tenant) {
    notFound()
  }

  const supabase = createSupabaseServiceClient()

  const [{ data: service }, { data: professional }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name')
      .eq('id', serviceId)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('professionals')
      .select('id, name')
      .eq('id', professionalId)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .single(),
  ])

  if (!service || !professional) {
    notFound()
  }

  const slotDate = new Date(slot)
  const slotLabel = new Intl.DateTimeFormat('pt-BR', {
    timeZone: tenant.timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(slotDate)

  const primary = tenant.primary_color ?? '#ec4899'

  const backUrl = `/book/${serviceId}/${professionalId}`

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-5">
          <Link
            href={backUrl}
            className="text-2xl leading-none text-stone-500 transition-colors hover:text-stone-900"
          >
            ←
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
              Passo 3 de 3
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-stone-900">
              Seus dados
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-8">
        <ConfirmForm
          serviceId={serviceId}
          professionalId={professionalId}
          slot={slot}
          primary={primary}
          serviceName={service.name}
          professionalName={professional.name}
          slotLabel={slotLabel}
        />
      </section>
    </main>
  )
}
