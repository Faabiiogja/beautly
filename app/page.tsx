import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const tenant = await getCurrentTenant()

  if (!tenant) {
    notFound()
  }

  const supabase = createSupabaseServiceClient()
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('name')

  const activeServices = services ?? []
  const primary = tenant.primary_color ?? '#ec4899'

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 md:flex-row md:items-end md:justify-between md:px-10">
          <div className="max-w-2xl space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              Beautly Booking
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-stone-900 md:text-6xl">
                {tenant.name}
              </h1>
              <p className="max-w-xl text-base leading-7 text-stone-600 md:text-lg">
                Agende seu horario com facilidade e escolha o melhor servico,
                profissional e horario em poucos passos.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end">
            <Link
              href="/book"
              className="rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primary }}
            >
              Agendar agora
            </Link>
            <p className="text-sm text-stone-500">
              Fluxo publico de agendamento sem login.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 md:px-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              Servicos ativos
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-900">
              Escolha com contexto antes de agendar
            </h2>
          </div>
        </div>

        {activeServices.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 px-6 py-14 text-center text-sm text-stone-500">
            Nenhum servico disponivel no momento.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeServices.map((service) => (
              <article
                key={service.id}
                className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">
                      {service.name}
                    </h3>
                    <p className="mt-2 text-sm text-stone-500">
                      {service.duration_minutes} min
                    </p>
                  </div>
                  <div
                    className="rounded-full px-3 py-1 text-sm font-semibold"
                    style={{
                      backgroundColor: `${primary}14`,
                      color: primary,
                    }}
                  >
                    R$ {Number(service.price).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
