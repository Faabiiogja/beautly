import Link from 'next/link'
import { PageHeader } from '@/components/panel/PageHeader'
import { FormMessage } from '@/components/auth/FormMessage'
import { groupByDay, toAgendaItem } from '@/lib/agenda'
import { requirePanelSession } from '@/lib/auth/dal'
import { todayInSaoPaulo } from '@/lib/dates'
import { createClient } from '@/lib/supabase/server'
import { AgendaList } from './AgendaList'
import { AVISO_TEXT } from './avisos'

const UPCOMING_LIMIT = 200
const PAST_LIMIT = 100

export default async function AppointmentsPage({ searchParams }: PageProps<'/agendamentos'>) {
  await requirePanelSession()
  const { ver, aviso } = await searchParams
  const notice = typeof aviso === 'string' ? AVISO_TEXT[aviso] : undefined
  const past = ver === 'anteriores'

  const now = new Date()
  const today = todayInSaoPaulo(now)
  const supabase = await createClient()

  // RLS já restringe ao tenant da profissional. Próximos: ainda não terminaram, do mais cedo ao mais tarde.
  // Anteriores: já terminaram, do mais recente ao mais antigo.
  const base = supabase
    .from('appointments')
    .select('id, status, service_name_snapshot, price_cents_snapshot, duration_minutes_snapshot, client_name, client_phone, start_time, end_time')
  const query = past
    ? base.lte('end_time', now.toISOString()).order('start_time', { ascending: false }).order('id').limit(PAST_LIMIT)
    : base.gt('end_time', now.toISOString()).order('start_time', { ascending: true }).order('id').limit(UPCOMING_LIMIT)

  const [{ data: rows }, { data: blocked }] = await Promise.all([
    query,
    supabase.from('blocked_days').select('day').gte('day', today),
  ])

  const items = (rows ?? []).map(toAgendaItem)
  const groups = groupByDay(items, today)
  const limit = past ? PAST_LIMIT : UPCOMING_LIMIT

  const tab = (active: boolean) =>
    `flex h-11 items-center rounded-full px-5 text-label-md transition ${active ? 'bg-brand text-on-brand' : 'bg-card text-muted shadow-soft'}`

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="Agendamentos" subtitle="Sua agenda em ordem cronológica. Horários em Brasília." />

      {notice && <FormMessage tone={notice.tone}>{notice.text}</FormMessage>}

      <nav aria-label="Período" className="flex gap-2">
        <Link href="/agendamentos" aria-current={past ? undefined : 'page'} className={tab(!past)}>
          Próximos
        </Link>
        <Link href="/agendamentos?ver=anteriores" aria-current={past ? 'page' : undefined} className={tab(past)}>
          Anteriores
        </Link>
      </nav>

      {groups.length === 0 ? (
        <p className="rounded-card bg-subtle p-6 text-center text-muted">
          {past ? 'Nenhum agendamento anterior.' : 'Nenhum agendamento por enquanto. Compartilhe o link da sua página com suas clientes.'}
        </p>
      ) : (
        <AgendaList groups={groups} blockedDays={new Set((blocked ?? []).map((b) => b.day))} now={now} />
      )}

      {items.length >= limit && (
        <p className="text-center text-sm text-muted">Mostrando os {limit} {past ? 'mais recentes' : 'primeiros'}.</p>
      )}
    </main>
  )
}
