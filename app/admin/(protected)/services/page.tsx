import { requireAdmin } from '@/lib/admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { ServiceDialog } from './_components/service-dialog'
import { toggleService, deleteService } from './actions'

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price, description, is_active')
    .eq('tenant_id', session.tenantId)
    .order('name')

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-stone-900">Serviços</h1>
        <ServiceDialog
          trigger={
            <button className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 transition-colors">
              Novo serviço
            </button>
          }
        />
      </div>

      {!services?.length ? (
        <p className="text-sm text-stone-500">Nenhum serviço cadastrado.</p>
      ) : (
        <ul className="space-y-3">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">{service.name}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {service.duration_minutes} min
                  {service.price != null ? ` · R$ ${service.price.toFixed(2)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ToggleServiceForm serviceId={service.id} isActive={service.is_active} />
                <ServiceDialog
                  service={service}
                  trigger={
                    <button className="text-xs text-stone-500 hover:text-stone-900">
                      Editar
                    </button>
                  }
                />
                <DeleteServiceForm serviceId={service.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

async function ToggleServiceForm({
  serviceId,
  isActive,
}: {
  serviceId: string
  isActive: boolean
}) {
  async function toggle() {
    'use server'
    await toggleService(serviceId, !isActive)
  }

  return (
    <form action={toggle}>
      <button
        type="submit"
        className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
          isActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
        }`}
      >
        {isActive ? 'Ativo' : 'Inativo'}
      </button>
    </form>
  )
}

async function DeleteServiceForm({ serviceId }: { serviceId: string }) {
  async function remove() {
    'use server'
    await deleteService(serviceId)
  }

  return (
    <form action={remove}>
      <button type="submit" className="text-xs text-red-400 hover:text-red-600">
        Excluir
      </button>
    </form>
  )
}
