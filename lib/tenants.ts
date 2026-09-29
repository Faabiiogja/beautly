import { createAnonClient } from '@/lib/supabase/anon'

export type PublicTenant = {
  business_name: string
  logo_url: string | null
  phone: string
  address: string | null
  description: string | null
}

export type PublicService = {
  id: string
  name: string
  price_cents: number
  duration_minutes: number
}

// Retorna null se o tenant não existe ou está inativo (RLS já esconde tenants inativos do anon).
export async function getPublicPage(subdomain: string) {
  const supabase = createAnonClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, business_name, logo_url, phone, address, description')
    .eq('subdomain', subdomain)
    .maybeSingle()
  if (error) throw error
  if (!tenant) return null

  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, price_cents, duration_minutes')
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .order('name')
  if (servicesError) throw servicesError

  const publicTenant: PublicTenant = {
    business_name: tenant.business_name,
    logo_url: tenant.logo_url,
    phone: tenant.phone,
    address: tenant.address,
    description: tenant.description,
  }
  return { tenant: publicTenant, services: services as PublicService[] }
}
