import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { Toaster } from '@/components/ui/sonner'
import { logoutAdminAction } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Painel Admin — Beautly',
}

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/services', label: 'Serviços' },
  { href: '/admin/professionals', label: 'Profissionais' },
  { href: '/admin/schedule', label: 'Horários' },
  { href: '/admin/settings', label: 'Configurações' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen bg-stone-100">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col bg-white border-r border-stone-200 lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-stone-200 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100">
            <div className="h-3 w-3 rounded-full bg-pink-500" />
          </div>
          <span className="text-sm font-semibold text-stone-900">Beautly Admin</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-stone-200 p-3">
          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <Toaster />
    </div>
  )
}
