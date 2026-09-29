import { StatusBadge } from '@/components/StatusBadge'
import { canCancel, displayStatus } from '@/lib/appointment-status'
import type { AgendaItem, DayGroup } from '@/lib/agenda'
import { toLocalDayAndTime } from '@/lib/dates'
import { formatDuration, formatPrice } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import { CancelButton } from './CancelButton'

type Props = { groups: DayGroup[]; blockedDays: Set<string>; now: Date }

const time = (iso: string) => toLocalDayAndTime(new Date(iso)).time

// Um confirmado que ainda vale (não terminou), num dia que a profissional bloqueou depois: ela precisa ver.
const inBlockedDay = (day: string, item: AgendaItem, blocked: Set<string>, now: Date) => blocked.has(day) && canCancel(item, now)

function BlockedNote() {
  return (
    <span className="mt-1 block text-sm text-danger">
      Dia bloqueado: este agendamento continua valendo até você cancelar.
    </span>
  )
}

export function AgendaList({ groups, blockedDays, now }: Props) {
  return (
    <>
      {/* Desktop: uma tabela só, com a coluna Data em todas as linhas (colunas alinhadas entre os dias) */}
      <div className="hidden overflow-hidden rounded-card bg-card shadow-soft md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-container-low text-label-sm uppercase text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Data</th>
              <th scope="col" className="px-4 py-3">Hora</th>
              <th scope="col" className="px-4 py-3">Cliente</th>
              <th scope="col" className="px-4 py-3">Serviço</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          {groups.map((group) => (
            // um <tbody> por dia: separa os dias visualmente sem quebrar o alinhamento das colunas
            <tbody key={group.day} className="border-t-2 border-border-soft">
              {group.items.map((item, index) => {
                const status = displayStatus(item, now)
                return (
                  <tr key={item.id} className={`${index > 0 ? 'border-t border-border-soft' : ''} ${status === 'cancelled' ? 'opacity-60' : ''}`}>
                    <th scope="row" className="whitespace-nowrap px-4 py-3 align-top font-normal text-ink">
                      {group.label}
                    </th>
                    <td className="px-4 py-3 align-top">
                      <span className="font-headline text-headline-sm text-ink">{time(item.start_time)}</span>
                      <span className="block text-muted">{formatDuration(item.duration_minutes)}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="block text-ink">{item.client_name}</span>
                      <a href={`tel:+55${item.client_phone}`} className="text-muted underline-offset-2 hover:underline">
                        {formatPhone(item.client_phone)}
                      </a>
                      {inBlockedDay(group.day, item, blockedDays, now) && <BlockedNote />}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="block text-ink">{item.service_name}</span>
                      <span className="text-muted">{formatPrice(item.price_cents)}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      {canCancel(item, now) && <CancelButton id={item.id} clientName={item.client_name} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          ))}
        </table>
      </div>

      {/* Celular: cartões agrupados por dia */}
      <div className="flex flex-col gap-6 md:hidden">
        {groups.map((group) => (
          <section key={group.day} aria-labelledby={`dia-${group.day}`} className="flex flex-col gap-2">
            <h2 id={`dia-${group.day}`} className="font-headline text-headline-sm text-ink">
              {group.label}
            </h2>
            <ul className="flex flex-col gap-2">
              {group.items.map((item) => {
                const status = displayStatus(item, now)
                return (
                  <li key={item.id} className={`flex flex-col gap-2 rounded-card bg-card p-4 shadow-soft ${status === 'cancelled' ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-headline text-headline-sm text-ink">
                        {time(item.start_time)} <span className="text-sm font-normal text-muted">· {formatDuration(item.duration_minutes)}</span>
                      </span>
                      <StatusBadge status={status} />
                    </div>
                    <div>
                      <span className="block text-ink">{item.client_name}</span>
                      <a href={`tel:+55${item.client_phone}`} className="text-sm text-muted underline-offset-2 hover:underline">
                        {formatPhone(item.client_phone)}
                      </a>
                    </div>
                    <div className="text-sm text-muted">
                      {item.service_name} · {formatPrice(item.price_cents)}
                    </div>
                    {inBlockedDay(group.day, item, blockedDays, now) && <BlockedNote />}
                    {canCancel(item, now) && (
                      <div>
                        <CancelButton id={item.id} clientName={item.client_name} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
