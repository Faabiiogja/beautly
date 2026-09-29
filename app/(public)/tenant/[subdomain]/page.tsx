import type { Metadata } from 'next'
import { BusinessPage } from '@/components/public/BusinessPage'
import { Unavailable } from '@/components/public/Unavailable'
import { getPublicPage } from '@/lib/tenants'

// Páginas de tenant não devem ser indexadas até haver decisão de SEO (e a de indisponível nunca).
export const metadata: Metadata = { robots: { index: false } }

export default async function TenantPage({ params }: PageProps<'/tenant/[subdomain]'>) {
  const { subdomain } = await params
  const page = await getPublicPage(subdomain)
  if (!page) return <Unavailable />
  return <BusinessPage {...page} />
}
