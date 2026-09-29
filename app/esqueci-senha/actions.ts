'use server'

import { validateEmail } from '@/lib/auth/validation'
import { createClient } from '@/lib/supabase/server'

// Origem fixa (nunca derivada do header Host): evita link de recuperação apontando para host forjado.
const PANEL_URL =
  process.env.NEXT_PUBLIC_PANEL_URL ?? `https://painel.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'beautly.cloud'}`

export type ResetRequestState = { error?: string; sent?: boolean }

export async function requestPasswordReset(_prev: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const parsed = validateEmail(String(formData.get('email') ?? ''))
  if (!parsed.ok) return { error: parsed.error }

  const supabase = await createClient()
  // O resultado não é exposto: a resposta é igual para e-mail cadastrado ou não.
  await supabase.auth.resetPasswordForEmail(parsed.value, { redirectTo: `${PANEL_URL}/auth/callback` })
  return { sent: true }
}
