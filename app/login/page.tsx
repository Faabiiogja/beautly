import { redirect } from 'next/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { getPanelAccess } from '@/lib/auth/dal'
import { REASON } from '@/lib/auth/reasons'
import { LoginForm } from './LoginForm'

const NOTICES: Record<string, string> = {
  [REASON.unavailable]: 'Seu acesso não está disponível no momento.',
  [REASON.passwordChanged]: 'Senha alterada. Entre com a nova senha.',
}

// Fica FORA do route group (painel): o layout guardado redireciona para cá, então cair aqui
// dentro dele criaria um loop de redirect.
export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  // Só redireciona quem realmente tem acesso; sessão sem acesso fica no login (sem loop).
  if ((await getPanelAccess()).kind === 'ok') redirect('/agendamentos')

  const { motivo } = await searchParams
  const notice = typeof motivo === 'string' ? NOTICES[motivo] : undefined
  return (
    <AuthCard title="Entrar no painel" subtitle="Acesse sua agenda e seus serviços.">
      <LoginForm notice={notice} />
    </AuthCard>
  )
}
