// lib/tenant.ts
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Tenant = Database['public']['Tables']['tenants']['Row']

/**
 * Extrai o tenant slug do host.
 * Retorna null para admin.beautly.com (super admin context).
 * Retorna o fallback para ambientes de dev/preview.
 */
export function extractTenantSlug(host: string, fallback = 'demo'): string | null {
  // Remove porta se presente
  const hostname = host.split(':')[0]

  // Super admin — sem tenant
  if (hostname === 'admin.beautly.com') return null

  // Dev local
  if (hostname === 'localhost' || hostname === '127.0.0.1') return fallback

  // Preview Vercel
  if (hostname.endsWith('.vercel.app')) return fallback

  // Produção: extrai o primeiro segmento do subdomínio
  const parts = hostname.split('.')
  if (parts.length >= 3) return parts[0]

  return fallback
}

/**
 * Busca tenant por slug com cache de 60 segundos.
 * Usa service_role para leitura pública (sem auth necessária).
 */
export const getTenantBySlug = unstable_cache(
  async (slug: string): Promise<Tenant | null> => {
    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (error || !data) return null
    return data
  },
  ['tenant-by-slug'],
  { revalidate: 60 }
)

/**
 * Obtém o tenant atual a partir do header injetado pelo middleware.
 * Usar em Server Components e Server Actions.
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')
  if (!slug) return null
  return getTenantBySlug(slug)
}
