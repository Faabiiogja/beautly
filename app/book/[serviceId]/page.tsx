import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { AvailabilityPicker } from './_components/availability-picker'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ serviceId: string }>
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default async function ServicePage({ params }: PageProps) {
  const { serviceId } = await params
  const tenant = await getCurrentTenant()

  if (!tenant) {
    notFound()
  }

  const supabase = createSupabaseServiceClient()

  // Valida se o servico pertence ao tenant
  const { data: service } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('id', serviceId)
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .single()

  if (!service) {
    notFound()
  }

  // Busca profissionais ativos do tenant
  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, name, bio, avatar_url')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order')

  const activeProfessionals = professionals ?? []
  const primary = tenant.primary_color ?? '#ec4899'

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-5">
          <Link
            href="/book"
            className="text-2xl leading-none text-stone-500 transition-colors hover:text-stone-900"
          >
            ←
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
              Passo 2 de 3
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-stone-900">
              {activeProfessionals.length === 1
                ? 'Escolha o horário'
                : 'Escolha o profissional'}
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-8">
        {/* Servico selecionado */}
        <div className="mb-6 rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-medium text-stone-600">{service.name}</p>
          <p className="text-xs text-stone-400">
            {service.duration_minutes} min &middot; R${' '}
            {Number(service.price).toFixed(2).replace('.', ',')}
          </p>
        </div>

        {/* Nenhum profissional */}
        {activeProfessionals.length === 0 && (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center text-sm text-stone-500">
            Nenhum profissional disponível no momento.
          </div>
        )}

        {/* 1 profissional — mostra o picker diretamente */}
        {activeProfessionals.length === 1 && (
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: primary }}
              >
                {getInitials(activeProfessionals[0].name)}
              </div>
              <div>
                <p className="font-semibold text-stone-900">{activeProfessionals[0].name}</p>
                {activeProfessionals[0].bio && (
                  <p className="text-sm text-stone-500">{activeProfessionals[0].bio}</p>
                )}
              </div>
            </div>
            <AvailabilityPicker
              serviceId={serviceId}
              professionalId={activeProfessionals[0].id}
              timezone={tenant.timezone}
              primary={primary}
              backPath={`/book/${serviceId}`}
            />
          </div>
        )}

        {/* >1 profissionais — lista de selecao */}
        {activeProfessionals.length > 1 && (
          <div className="flex flex-col gap-3">
            {activeProfessionals.map((prof) => (
              <Link
                key={prof.id}
                href={`/book/${serviceId}/${prof.id}`}
                className="flex items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-stone-300"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: primary }}
                  >
                    {getInitials(prof.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{prof.name}</p>
                    {prof.bio && (
                      <p className="mt-0.5 text-sm text-stone-500 line-clamp-2">{prof.bio}</p>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 text-xl text-stone-300">›</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
