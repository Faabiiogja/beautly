// components/tenant/home-page.tsx
import { notFound } from 'next/navigation'
import { getCurrentTenant, getServicesByTenantId } from '@/lib/tenant'
import { HeroSection } from '@/components/tenant/hero-section'
import { ServicesSection } from '@/components/tenant/services-section'

export async function TenantHomePage() {
  const tenant = await getCurrentTenant()
  if (!tenant) notFound()

  const services = await getServicesByTenantId(tenant.id)

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <HeroSection name={tenant.name} logoUrl={tenant.logo_url} />
      <ServicesSection services={services} />
      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} {tenant.name} · Powered by Beautly
      </footer>
    </main>
  )
}
