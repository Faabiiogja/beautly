'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/agendamentos', label: 'Agendamentos' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/horarios', label: 'Horários' },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Painel" className="mx-auto flex w-full max-w-[1200px] gap-1 overflow-x-auto px-4 pb-3 md:px-6">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex h-11 shrink-0 items-center rounded-full px-5 text-label-md transition ${
              active ? 'bg-brand text-on-brand' : 'text-muted hover:bg-subtle'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
