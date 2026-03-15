'use server'

import { redirect } from 'next/navigation'
import { logoutAdmin, getAdminSession } from '@/lib/admin/auth'

export async function logoutAdminAction(): Promise<void> {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  await logoutAdmin()
  redirect('/admin/login')
}
