import { formatDuration, formatPrice } from '@/lib/format'
import type { PublicService, PublicTenant } from '@/lib/tenants'

export function BusinessPage({ tenant, services }: { tenant: PublicTenant; services: PublicService[] }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        {tenant.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element -- domínio do storage ainda não definido
          <img src={tenant.logo_url} alt="" className="h-24 w-24 rounded-full object-cover" />
        )}
        <h1 className="text-2xl font-semibold">{tenant.business_name}</h1>
        {tenant.description && <p className="text-zinc-600">{tenant.description}</p>}
        <p className="text-sm text-zinc-600">{tenant.phone}</p>
        {tenant.address && <p className="text-sm text-zinc-600">{tenant.address}</p>}
      </header>

      <section aria-labelledby="servicos" className="flex flex-col gap-3">
        <h2 id="servicos" className="text-lg font-medium">
          Serviços
        </h2>
        {services.length === 0 ? (
          <p className="text-zinc-600">Nenhum serviço disponível no momento.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {services.map((service) => (
              <li key={service.id} className="flex items-center justify-between rounded-lg border p-4">
                <span className="font-medium">{service.name}</span>
                <span className="text-sm text-zinc-600">
                  {formatDuration(service.duration_minutes)} · {formatPrice(service.price_cents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
