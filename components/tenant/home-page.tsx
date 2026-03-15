// components/tenant/home-page.tsx
import { notFound } from 'next/navigation'
import { getCurrentTenant, getServicesByTenantId } from '@/lib/tenant'
import { HeroSection } from '@/components/tenant/hero-section'
import { ServicesSection } from '@/components/tenant/services-section'
import { Header } from '@/components/tenant/header'

export async function TenantHomePage() {
  const tenant = await getCurrentTenant()
  if (!tenant) notFound()

  const services = await getServicesByTenantId(tenant.id)

  return (
    <div className="bg-[#f8f6f7] dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 min-h-screen">
      <Header tenant={tenant} />

      <main>
        <HeroSection name={tenant.name} logoUrl={tenant.logo_url} />
        <ServicesSection services={services} />

        <section className="max-w-[1440px] mx-auto px-6 lg:px-20 py-24">
          <div className="bg-gradient-to-r from-[#ec4899] to-[#ec4899]/60 rounded-3xl p-12 lg:p-20 flex flex-col items-center text-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

            <h2 className="text-4xl lg:text-6xl font-black text-white max-w-2xl leading-tight relative z-10">
              Pronta para transformar seu visual?
            </h2>
            <p className="text-white/80 text-lg lg:text-xl max-w-lg relative z-10">
              Escolha o melhor horário para você e reserve em poucos segundos.
            </p>
            <button className="bg-white text-[#ec4899] hover:bg-slate-100 px-12 py-5 rounded-xl font-black text-xl transition-all shadow-2xl relative z-10">
              Agende agora mesmo
            </button>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-slate-200 dark:border-white/5 bg-[#f8f6f7] dark:bg-[#0a0a0a] py-12">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 flex flex-col items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <div className="bg-[#ec4899] p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-white text-sm">content_cut</span>
            </div>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">{tenant.name}</h2>
          </div>

          <div className="flex gap-8 text-slate-500 text-sm font-medium">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Ajuda</a>
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.
            </p>
            <p className="text-slate-600 text-xs flex items-center gap-1">
              Powered by <span className="text-[#ec4899] font-semibold">Beautly</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
