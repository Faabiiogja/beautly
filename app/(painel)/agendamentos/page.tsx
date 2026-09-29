import { requirePanelSession } from '@/lib/auth/dal'

export default async function AppointmentsPage() {
  await requirePanelSession()
  return (
    <main>
      <h1 className="font-headline text-headline-md text-ink">Agendamentos</h1>
      <p className="mt-2 text-muted">Nenhum agendamento por enquanto.</p>
    </main>
  )
}
