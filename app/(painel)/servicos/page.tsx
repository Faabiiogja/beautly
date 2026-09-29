import { PageHeader } from '@/components/panel/PageHeader'
import { requirePanelSession } from '@/lib/auth/dal'
import { formatDuration, formatPrice } from '@/lib/format'
import { formatPriceInput } from '@/lib/services'
import { createClient } from '@/lib/supabase/server'
import { setServiceActive } from './actions'
import { ServiceForm } from './ServiceForm'

export default async function ServicesPage() {
  await requirePanelSession()
  const supabase = await createClient()
  // RLS já limita ao tenant da profissional
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price_cents, duration_minutes, active')
    .order('active', { ascending: false })
    .order('name')

  return (
    <main className="flex max-w-2xl flex-col gap-8">
      <PageHeader title="Serviços" subtitle="O que suas clientes podem agendar. Serviços inativos somem da sua página, mas agendamentos já feitos continuam valendo." />

      <section aria-labelledby="novo" className="rounded-panel bg-card p-6 shadow-soft">
        <h2 id="novo" className="mb-4 font-headline text-headline-sm text-ink">
          Novo serviço
        </h2>
        <ServiceForm mode="create" />
      </section>

      <section aria-labelledby="lista" className="flex flex-col gap-3">
        <h2 id="lista" className="font-headline text-headline-sm text-ink">
          Seus serviços
        </h2>
        {!services?.length ? (
          <p className="rounded-card bg-subtle p-6 text-center text-muted">Você ainda não cadastrou nenhum serviço.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {services.map((service) => (
              <li key={service.id} className={`rounded-card bg-card p-4 shadow-soft ${service.active ? '' : 'opacity-70'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-headline text-headline-sm text-ink">{service.name}</p>
                    <p className="text-sm text-muted">
                      {formatDuration(service.duration_minutes)} · {formatPrice(service.price_cents)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-label-sm uppercase ${
                        service.active ? 'bg-brand-tint text-brand' : 'bg-danger-tint text-danger'
                      }`}
                    >
                      {service.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <form action={setServiceActive}>
                      <input type="hidden" name="id" value={service.id} />
                      <input type="hidden" name="active" value={String(!service.active)} />
                      <button type="submit" className="h-11 rounded-full border-[1.5px] border-border-soft px-4 text-label-md text-ink">
                        {service.active ? 'Inativar' : 'Reativar'}
                      </button>
                    </form>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="flex h-11 cursor-pointer items-center text-label-md text-primary">Editar</summary>
                  <div className="pt-3">
                    <ServiceForm
                      mode="edit"
                      defaults={{
                        id: service.id,
                        name: service.name,
                        price: formatPriceInput(service.price_cents),
                        duration: String(service.duration_minutes),
                      }}
                    />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
