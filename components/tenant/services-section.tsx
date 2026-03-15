// components/tenant/services-section.tsx
import type { Service } from '@/lib/tenant'
import { ServiceCard } from '@/components/tenant/service-card'

type Props = {
  services: Service[]
}

export function ServicesSection({ services }: Props) {
  return (
    <section className="px-6 py-10 md:px-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Nossos Serviços</h2>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-white/50">Em breve</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </section>
  )
}
