import { requirePanelSession } from '@/lib/auth/dal'
import { BottomNav } from '@/components/panel/BottomNav'
import { MobileHeader } from '@/components/panel/MobileHeader'
import { Sidebar } from '@/components/panel/Sidebar'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'beautly.cloud'

// Guarda de sessão do painel. O layout não re-renderiza a cada navegação, então cada página e
// action do painel também precisa chamar requirePanelSession() (ver lib/auth/dal.ts).
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const tenant = await requirePanelSession()
  const publicDisplay = `${tenant.subdomain}.${ROOT_DOMAIN}`
  const publicUrl = `https://${publicDisplay}`

  return (
    <div className="min-h-screen bg-canvas md:flex">
      <Sidebar businessName={tenant.business_name} publicUrl={publicUrl} publicDisplay={publicDisplay} />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileHeader businessName={tenant.business_name} />
        <div className="mx-auto w-full max-w-[1000px] flex-1 px-4 pt-6 pb-28 md:px-10 md:py-10">{children}</div>
      </div>
      <BottomNav />
    </div>
  )
}
