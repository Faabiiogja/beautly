import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { AvailabilityPicker } from '../_components/availability-picker'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ serviceId: string; professionalId: string }>
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default async function ProfessionalSchedulePage({ params }: PageProps) {
  const { serviceId, professionalId } = await params
  const tenant = await getCurrentTenant()

  if (!tenant) {
    notFound()
  }

  const supabase = createSupabaseServiceClient()

  // Valida servico e profissional pertencem ao tenant
  const [{ data: service }, { data: professional }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('id', serviceId)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('professionals')
      .select('id, name, bio, avatar_url')
      .eq('id', professionalId)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .single(),
  ])

  if (!service || !professional) {
    notFound()
  }

  const primary = tenant.primary_color ?? '#ec4899'

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-5">
          <Link
            href={`/book/${serviceId}`}
            className="text-2xl leading-none text-stone-500 transition-colors hover:text-stone-900"
          >
            ←
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
              Passo 2 de 3
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-stone-900">
              Escolha o horário
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          {/* Info do profissional */}
          <div className="mb-6 flex items-center gap-4">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              {getInitials(professional.name)}
            </div>
            <div>
              <p className="font-semibold text-stone-900">{professional.name}</p>
              {professional.bio && (
                <p className="text-sm text-stone-500">{professional.bio}</p>
              )}
            </div>
          </div>

          {/* Servico selecionado */}
          <div className="mb-6 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
            <p className="text-sm font-medium text-stone-600">{service.name}</p>
            <p className="text-xs text-stone-400">
              {service.duration_minutes} min &middot; R${' '}
              {Number(service.price).toFixed(2).replace('.', ',')}
            </p>
          </div>

          <AvailabilityPicker
            serviceId={serviceId}
            professionalId={professionalId}
            timezone={tenant.timezone}
            primary={primary}
            backPath={`/book/${serviceId}/${professionalId}`}
          />
        </div>
      </section>
    </main>
  )
}
