// components/tenant/header.tsx
import { Scissors } from 'lucide-react'
import type { Database } from '@/types/database'

type Tenant = Database['public']['Tables']['tenants']['Row']

export function Header({ tenant }: { tenant: Tenant }) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-white/10 bg-[#f8f6f7]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-20 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-[#ec4899] p-2 rounded-lg">
                        <Scissors className="text-white w-6 h-6" />
                    </div>
                    <h2 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">
                        {tenant.name}
                    </h2>
                </div>

                <nav className="hidden md:flex items-center gap-8 mr-8">
                    <a className="text-sm font-medium hover:text-[#ec4899] transition-colors" href="#">Início</a>
                    <a className="text-sm font-medium hover:text-[#ec4899] transition-colors" href="#servicos">Serviços</a>
                    <a className="text-sm font-medium hover:text-[#ec4899] transition-colors" href="#">Sobre</a>
                    <a className="text-sm font-medium hover:text-[#ec4899] transition-colors" href="#">Contato</a>
                </nav>

                <button className="bg-[#ec4899] hover:bg-[#ec4899]/90 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#ec4899]/20 hidden sm:block">
                    Agendar agora
                </button>
            </div>
        </header>
    )
}
