'use server'

import { redirect } from 'next/navigation'
import { validateNewPassword } from '@/lib/auth/validation'
import { createClient } from '@/lib/supabase/server'
import { REASON } from '@/lib/auth/reasons'

export type NewPasswordState = { error?: string; fieldErrors?: { password?: string; confirm?: string } }

export async function updatePassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const parsed = validateNewPassword(String(formData.get('password') ?? ''), String(formData.get('confirm') ?? ''))
  if (!parsed.ok) return { fieldErrors: parsed.errors }

  const supabase = await createClient()
  // Exige a sessão de recuperação criada pelo link do e-mail (/auth/callback).
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/esqueci-senha?motivo=${REASON.invalidLink}`)

  const { error } = await supabase.auth.updateUser({ password: parsed.password })
  if (error) return { error: 'Não foi possível alterar a senha. Peça um novo link.' }

  // global: encerra também as outras sessões da conta depois de trocar a senha
  await supabase.auth.signOut({ scope: 'global' })
  redirect(`/login?motivo=${REASON.passwordChanged}`)
}
