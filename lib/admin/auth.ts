import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export type AdminSession = {
  userId: string
  tenantId: string
  role: 'owner' | 'staff'
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const tenant = await getCurrentTenant()
  if (!tenant) return null

  const { data: tenantUser, error: tenantUserError } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .single()

  if (tenantUserError && tenantUserError.code !== 'PGRST116') {
    console.error('[getAdminSession] tenant_users query error:', tenantUserError)
    return null
  }

  if (!tenantUser) return null

  const role = tenantUser.role
  if (role !== 'owner' && role !== 'staff') return null

  return {
    userId: user.id,
    tenantId: tenant.id,
    role,
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }
  return session
}

export async function logoutAdmin(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
}
