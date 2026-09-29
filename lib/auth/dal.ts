import { cache } from 'react'
import { redirect } from 'next/navigation'
import { fetchPanelAccess } from '@/lib/auth/access'
import type { PanelAccess } from '@/lib/panel-access'
import { createClient } from '@/lib/supabase/server'

// Memoizado por render. Toda página, action e route handler do painel deve passar por aqui.
export const getPanelAccess = cache(async (): Promise<PanelAccess> => fetchPanelAccess(await createClient()))

export async function requirePanelSession() {
  const access = await getPanelAccess()
  if (access.kind === 'login') redirect('/login')
  // Route handler pode limpar os cookies; Server Component não. Ele encerra a sessão e volta ao login.
  if (access.kind === 'blocked') redirect('/auth/blocked')
  return access.tenant
}
