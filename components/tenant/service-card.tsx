import type { Service } from '@/lib/tenant'
import { Sparkles, ChevronRight } from 'lucide-react'

type Props = {
  service: Service
}

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function ServiceCard({ service }: Props) {
  return (
    <div className="flex items-center gap-4 bg-white dark:bg-[#1a1a1a] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:border-[#ec4899]/50 group cursor-pointer">
      <div className="text-[#ec4899] flex items-center justify-center rounded-lg bg-[#ec4899]/10 shrink-0 size-12">
        <Sparkles className="w-6 h-6" />
      </div>
      <div className="flex flex-col flex-1 justify-center">
        <p className="text-slate-900 dark:text-white text-base font-bold leading-none mb-1">
          {service.name}
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          <span>{priceFormatter.format(service.price)}</span> • <span>{service.duration_minutes} min</span>
        </p>
      </div>
      <div className="shrink-0">
        <div className="text-slate-400 flex size-7 items-center justify-center transition-transform group-hover:translate-x-1">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
