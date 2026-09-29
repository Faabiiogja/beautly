import { StatusBadge } from '@/components/StatusBadge'
import { ChatIcon } from '@/components/public/icons'
import { canCancel, displayStatus } from '@/lib/appointment-status'
import type { AgendaItem, DayGroup } from '@/lib/agenda'
import { toLocalDayAndTime } from '@/lib/dates'
import { formatDuration, formatPrice } from '@/lib/format'
import { formatPhone, whatsappUrl } from '@/lib/phone'
import { CancelButton } from './CancelButton'

type Props = { groups: DayGroup[]; blockedDays: Set<string>; now: Date }

const time = (iso: string) => toLocalDayAndTime(new Date(iso)).time

// Um confirmado que ainda vale (não terminou), num dia que a profissional bloqueou depois: ela precisa ver.
const inBlockedDay = (day: string, item: AgendaItem, blocked: Set<string>, now: Date) => blocked.has(day) && canCancel(item, now)

function BlockedNote() {
  return <span className="mt-1 block text-sm text-danger">Dia bloqueado: este agendamento continua valendo até você cancelar.</span>
}

export function AgendaList({ groups, blockedDays, now }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.day} aria-labelledby={`dia-${group.day}`} className="flex flex-col gap-3">
          <h2 id={`dia-${group.day}`} className="font-headline text-headline-sm text-ink">
            {group.label}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {group.items.map((item) => {
              const status = displayStatus(item, now)
              const cancelable = canCancel(item, now)
              const startTime = time(item.start_time)
              const phone = formatPhone(item.client_phone)
              return (
                <li key={item.id}>
                  <article
                    className={`flex flex-col gap-4 rounded-card border border-border-soft bg-card p-4 shadow-soft md:flex-row md:items-center md:justify-between ${
                      status === 'cancelled' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4 md:items-center">
                      <span className="shrink-0 rounded-full border border-border-soft bg-subtle px-3 py-1.5 text-center text-label-md font-semibold text-ink">
                        {startTime}
                      </span>
                      <div>
                        <h3 className="font-headline text-[17px] text-ink">{item.client_name}</h3>
                        <a
                          href={whatsappUrl(item.client_phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-[#25D366]"
                        >
                          <span className="text-[#25D366]">
                            <ChatIcon />
                          </span>
                          {phone}
                        </a>
                        <p className="mt-0.5 text-sm text-muted">
                          {item.service_name} · {formatDuration(item.duration_minutes)}
                        </p>
                        {inBlockedDay(group.day, item, blockedDays, now) && <BlockedNote />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border-soft/60 pt-3 md:border-t-0 md:pt-0">
                      <span className="font-headline text-headline-sm text-primary">{formatPrice(item.price_cents)}</span>
                      <StatusBadge status={status} />
                      {cancelable && (
                        <CancelButton
                          id={item.id}
                          clientName={item.client_name}
                          serviceName={item.service_name}
                          priceCents={item.price_cents}
                          whenLabel={`${group.label} às ${startTime}`}
                          phone={phone}
                        />
                      )}
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
