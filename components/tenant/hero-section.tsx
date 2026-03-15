// components/tenant/hero-section.tsx
import { Star } from 'lucide-react'

type Props = {
  name: string
  logoUrl: string | null
}

export function HeroSection({ name, logoUrl }: Props) {
  const safeLogo = logoUrl?.startsWith('https://')
    ? logoUrl
    : 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2000&auto=format&fit=crop'

  return (
    <section className="max-w-[1440px] mx-auto px-6 lg:px-20 py-12 lg:py-24">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ec4899]/10 border border-[#ec4899]/20 w-fit">
            <Star className="w-4 h-4 text-[#ec4899]" />
            <span className="text-[#ec4899] text-xs font-bold uppercase tracking-wider">
              Seu salão de beleza
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white">
              {name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg lg:text-xl max-w-lg leading-relaxed">
              Agende seu horário com facilidade e experimente o melhor em cuidados de beleza com nossos especialistas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button className="bg-[#ec4899] hover:bg-[#ec4899]/90 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-[#ec4899]/20">
              Agendar agora
            </button>
            <a href="#servicos" className="flex items-center justify-center bg-transparent border border-slate-300 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 px-10 py-4 rounded-xl font-bold text-lg transition-all">
              Ver serviços
            </a>
          </div>

        </div>

        <div className="relative group mt-8 lg:mt-0">
          <div className="absolute -inset-4 bg-[#ec4899]/20 rounded-3xl blur-2xl transition-all group-hover:bg-[#ec4899]/30"></div>
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-100 dark:bg-[#1a1a1a]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeLogo!}
              alt="Interior do salão"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
