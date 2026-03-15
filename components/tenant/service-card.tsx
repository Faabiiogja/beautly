import type { Service } from '@/lib/tenant'

type Props = {
  service: Service
}

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function ServiceCard({ service }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
      <span className="text-sm font-semibold text-white">{service.name}</span>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#ec4899]">
          {priceFormatter.format(service.price)}
        </span>
        <span className="text-xs text-white/50">{service.duration_minutes} min</span>
      </div>
    </div>
  )
}
