import { headers } from 'next/headers'
import { TenantHomePage } from '@/components/tenant/home-page'
import { BeautlyLandingPage } from '@/app/_components/marketing/landing-page'

export default async function RootPage() {
  const headersList = await headers()
  const context = headersList.get('x-context')

  if (context === 'tenant') {
    return <TenantHomePage />
  }
  return <BeautlyLandingPage />
}
