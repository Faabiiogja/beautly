import { AuthCard } from '@/components/auth/AuthCard'
import { REASON } from '@/lib/auth/reasons'
import { ResetRequestForm } from './ResetRequestForm'

export default async function ForgotPasswordPage({ searchParams }: PageProps<'/esqueci-senha'>) {
  const { motivo } = await searchParams
  return (
    <AuthCard title="Esqueci minha senha" subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha.">
      <ResetRequestForm invalidLink={motivo === REASON.invalidLink} />
    </AuthCard>
  )
}
