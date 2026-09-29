import { requirePanelSession } from '@/lib/auth/dal'
import { BrandEmblem } from '@/components/public/BrandEmblem'

// Guarda de sessão do painel. O layout não re-renderiza a cada navegação, então cada página e
// action do painel também precisa chamar requirePanelSession() (ver lib/auth/dal.ts).
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const tenant = await requirePanelSession()
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-border-soft bg-card">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-container-low p-1.5">
              <BrandEmblem />
            </span>
            <span className="font-headline text-headline-sm text-ink">{tenant.business_name}</span>
          </div>
          <form action="/auth/logout" method="post">
            <button type="submit" className="h-11 rounded-full border-[1.5px] border-border-soft px-5 text-label-md text-ink">
              Sair
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-6">{children}</div>
    </div>
  )
}
