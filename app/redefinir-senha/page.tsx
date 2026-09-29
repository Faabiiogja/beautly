import { redirect } from 'next/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { createClient } from '@/lib/supabase/server'
import { NewPasswordForm } from './NewPasswordForm'
import { REASON } from '@/lib/auth/reasons'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/esqueci-senha?motivo=${REASON.invalidLink}`)

  return (
    <AuthCard title="Criar nova senha" subtitle="Escolha uma senha com pelo menos 8 caracteres.">
      <NewPasswordForm />
    </AuthCard>
  )
}
