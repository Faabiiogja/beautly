// app/super-admin/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Beautly Admin',
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth is NOT checked here to avoid redirect loops on the login page.
  // Each protected page calls requireSuperAdmin() individually.
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      {children}
    </div>
  )
}
