'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isNavActive, NAV_ITEMS } from './nav-items'

// Barra de navegação inferior fixa do painel (celular). No desktop vira Sidebar.
export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Painel"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border-soft bg-card px-2 py-2 md:hidden"
    >
      {NAV_ITEMS.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = isNavActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex w-16 flex-col items-center gap-1 rounded-2xl py-1.5 text-label-sm transition ${active ? 'text-primary' : 'text-muted'}`}
          >
            <Icon />
            <span>{mobileLabel ?? label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
