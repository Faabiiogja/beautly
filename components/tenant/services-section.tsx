// components/tenant/services-section.tsx
import type { Service } from '@/lib/tenant'
import { ServiceCard } from '@/components/tenant/service-card'
import { ArrowRight } from 'lucide-react'

type Props = {
  services: Service[]
}

export function ServicesSection({ services }: Props) {
  return (
    <section id="servicos" className="max-w-[1440px] mx-auto px-6 lg:px-20 py-24 bg-white/[0.02]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex flex-col gap-4">
          <h2 className="text-slate-900 dark:text-white text-4xl font-bold tracking-tight">Nossos Serviços</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Oferecemos uma gama completa de serviços de beleza personalizados para realçar sua melhor versão.
          </p>
        </div>
        {services.length > 0 && (
          <a className="flex items-center gap-2 text-[#ec4899] font-bold hover:underline group cursor-pointer" href="#servicos">
            Ver todos os serviços
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        )}
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-slate-500">Em breve</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </section>
  )
}
