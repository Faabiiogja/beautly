import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export default async function BookPage() {
  const tenant = await getCurrentTenant()

  if (!tenant) {
    notFound()
  }

  const supabase = createSupabaseServiceClient()
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, description')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('name')

  const activeServices = services ?? []
  const primary = tenant.primary_color ?? '#ec4899'

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-5">
          <Link
            href="/"
            className="text-2xl leading-none text-stone-500 transition-colors hover:text-stone-900"
          >
            ←
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
              Passo 1 de 3
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-stone-900">
              Escolha o serviço
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-8">
        {activeServices.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center text-sm text-stone-500">
            Nenhum serviço disponível no momento.
          </div>
        ) : null}

        {activeServices.map((service) => (
          <Link
            key={service.id}
            href={`/book/${service.id}`}
            className="flex items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-stone-300"
          >
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-stone-900">
                {service.name}
              </h2>
              {service.description ? (
                <p className="text-sm leading-6 text-stone-500">
                  {service.description}
                </p>
              ) : null}
              <p className="text-sm text-stone-400">
                {service.duration_minutes} min
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div
                className="rounded-full px-3 py-1 text-sm font-semibold"
                style={{
                  backgroundColor: `${primary}14`,
                  color: primary,
                }}
              >
                R$ {Number(service.price).toFixed(2).replace('.', ',')}
              </div>
              <span className="text-xl text-stone-300">›</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
