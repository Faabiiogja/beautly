'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/shared/Logo'
import { LogoutIcon } from '@/components/public/icons'
import { CopyLinkPill } from './CopyLinkPill'
import { isNavActive, NAV_ITEMS } from './nav-items'

// Barra lateral fixa do painel (desktop). No celular vira MobileHeader + BottomNav.
export function Sidebar({ businessName, publicUrl, publicDisplay }: { businessName: string; publicUrl: string; publicDisplay: string }) {
  const pathname = usePathname()
  return (
    <aside className="hidden shrink-0 flex-col justify-between border-r border-border-soft bg-card p-6 md:flex md:w-72">
      <div className="flex flex-col gap-6">
        <Logo size="sm" />

        <div className="rounded-card border border-border-soft bg-subtle p-3.5">
          <p className="truncate text-headline-sm font-headline text-ink">{businessName}</p>
          <div className="mt-2">
            <CopyLinkPill url={publicUrl} display={publicDisplay} />
          </div>
        </div>

        <nav aria-label="Painel" className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-label-md transition ${
                  active ? 'bg-brand-tint font-semibold text-primary' : 'text-muted hover:bg-subtle'
                }`}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <form action="/auth/logout" method="post">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-label-md text-muted transition hover:bg-danger-tint hover:text-danger"
        >
          <LogoutIcon />
          <span>Sair</span>
        </button>
      </form>
    </aside>
  )
}
