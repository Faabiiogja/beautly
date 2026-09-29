'use server'

import { redirect } from 'next/navigation'
import { validateLogin } from '@/lib/auth/validation'
import { fetchPanelAccess } from '@/lib/auth/access'
import { createClient } from '@/lib/supabase/server'

export type LoginState = {
  error?: string
  fieldErrors?: { email?: string; password?: string }
  email?: string
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
  const parsed = validateLogin(email, String(formData.get('password') ?? ''))
  if (!parsed.ok) return { fieldErrors: parsed.errors, email }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.email, password: parsed.password })
  // Mesma mensagem para e-mail inexistente e senha errada.
  if (error || !data.user) return { error: 'E-mail ou senha incorretos.', email }

  if ((await fetchPanelAccess(supabase)).kind !== 'ok') {
    await supabase.auth.signOut()
    return { error: 'Seu acesso não está disponível no momento.', email }
  }

  redirect('/agendamentos')
}
