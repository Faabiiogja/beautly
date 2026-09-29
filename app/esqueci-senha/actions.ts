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
  // A pessoa vê sempre a mesma mensagem (igual para e-mail cadastrado ou não). Mas uma falha de envio, como o
  // SMTP recusando as credenciais, precisa aparecer no log do servidor; sem isso só seria descoberta nos
  // logs de autenticação do Supabase.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.value, { redirectTo: `${PANEL_URL}/auth/callback` })
  if (error) console.error('esqueci-senha: falha ao pedir a recuperação', { status: error.status, code: error.code, message: error.message })
  return { sent: true }
}
