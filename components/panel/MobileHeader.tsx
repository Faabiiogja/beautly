import { Logo } from '@/components/shared/Logo'
import { LogoutIcon } from '@/components/public/icons'

// Cabeçalho fino do painel no celular. No desktop essa informação vive na Sidebar.
export function MobileHeader({ businessName }: { businessName: string }) {
  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border-soft bg-canvas px-5 md:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <Logo size="sm" />
        <span className="truncate text-sm text-muted">{businessName}</span>
      </div>
      <form action="/auth/logout" method="post">
        <button
          type="submit"
          aria-label="Sair"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-danger-tint hover:text-danger"
        >
          <LogoutIcon />
        </button>
      </form>
    </header>
  )
}
