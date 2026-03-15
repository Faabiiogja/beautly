'use server'

import { logoutAdmin } from '@/lib/admin/auth'

export async function logoutAdminAction(): Promise<void> {
  await logoutAdmin()
}
