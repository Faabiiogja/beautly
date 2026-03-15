'use server'

import { redirect } from 'next/navigation'
import { logoutAdmin } from '@/lib/admin/auth'

export async function logoutAdminAction(): Promise<void> {
  await logoutAdmin()
  redirect('/admin/login')
}
