import { PageHeader } from '@/components/panel/PageHeader'
import { requirePanelSession } from '@/lib/auth/dal'
import { formatLongDate, todayInSaoPaulo } from '@/lib/dates'
import { defaultWeek, type DayInput } from '@/lib/hours'
import { createClient } from '@/lib/supabase/server'
import { removeBlockedDay } from './actions'
import { BlockedDayForm } from './BlockedDayForm'
import { WeekForm } from './WeekForm'

// "09:00:00" (Postgres time) -> "09:00"
const hhmm = (time: string | null) => (time ? time.slice(0, 5) : '')

export default async function HoursPage() {
  await requirePanelSession()
  const supabase = await createClient()
  const today = todayInSaoPaulo()

  const [{ data: hours }, { data: blocked }] = await Promise.all([
    supabase.from('working_hours').select('weekday, closed, start_time, end_time'),
    supabase.from('blocked_days').select('id, day').gte('day', today).order('day'),
  ])

  // Sem expediente salvo, mostra a sugestão padrão (só vale depois de salvar).
  const week = defaultWeek()
  hours?.forEach((row) => {
    week[row.weekday] = { closed: row.closed, start: hhmm(row.start_time), end: hhmm(row.end_time) } satisfies DayInput
  })

  return (
    <main className="flex max-w-2xl flex-col gap-10">
      <PageHeader title="Horários" subtitle="Quando você atende e os dias em que não atende." />

      <section aria-labelledby="expediente" className="flex flex-col gap-4">
        <h2 id="expediente" className="font-headline text-headline-md text-ink">
          Expediente
        </h2>
        {!hours?.length && <p className="text-sm text-muted">Você ainda não salvou seu expediente. Ajuste a sugestão abaixo e salve.</p>}
        <WeekForm initial={week} />
        <p className="text-sm text-muted">Mudar o expediente vale só para novos agendamentos. Os já confirmados continuam como estão.</p>
      </section>

      <section aria-labelledby="bloqueios" className="flex flex-col gap-4">
        <h2 id="bloqueios" className="font-headline text-headline-md text-ink">
          Dias bloqueados
        </h2>
        <div className="rounded-panel bg-card p-6 shadow-soft">
          <BlockedDayForm min={today} />
        </div>
        {!blocked?.length ? (
          <p className="rounded-card bg-subtle p-6 text-center text-muted">Nenhum dia bloqueado.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {blocked.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-card bg-card p-4 shadow-soft">
                <span className="text-ink">{formatLongDate(item.day)}</span>
                <form action={removeBlockedDay}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="h-11 rounded-full border-[1.5px] border-border-soft px-4 text-label-md text-ink">
                    Desbloquear
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-muted">Bloquear um dia não cancela agendamentos já confirmados nele. Cancele-os na aba Agendamentos, se precisar.</p>
      </section>
    </main>
  )
}
