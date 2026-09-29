import Link from 'next/link'
import type { AppointmentView as Appointment } from '@/lib/appointment-data'
import { canCancel, displayStatus } from '@/lib/appointment-status'
import type { DisplayStatus } from '@/lib/appointment-status'
import { formatLongDate, toLocalDayAndTime } from '@/lib/dates'
import { formatDuration, formatPrice } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import { CancelAppointment } from './CancelAppointment'
import { CopyLinkButton } from './CopyLinkButton'
import { Shell } from './Shell'

const BADGE: Record<DisplayStatus, { label: string; className: string }> = {
  confirmed: { label: 'Confirmado', className: 'bg-brand-tint text-brand' },
  cancelled: { label: 'Cancelado', className: 'bg-danger-tint text-danger' },
  past: { label: 'Já aconteceu', className: 'bg-subtle text-muted' },
}

export function AppointmentView({
  appointment,
  isNew,
  link,
  token,
  now = new Date(),
}: {
  appointment: Appointment
  isNew: boolean
  link: string
  token: string
  now?: Date
}) {
  const status = displayStatus(appointment, now)
  const { day, time } = toLocalDayAndTime(new Date(appointment.start_time))
  const firstName = appointment.client_name.split(' ')[0]
  const badge = BADGE[status]

  return (
    <Shell>
      <main className="flex flex-col gap-6 px-5 py-8">
        <header className="flex flex-col items-center gap-2 text-center">
          <span className={`rounded-full px-3 py-1 text-label-sm uppercase ${badge.className}`}>{badge.label}</span>
          <h1 className="font-headline text-headline-lg text-ink">
            {isNew && status === 'confirmed' ? `Tudo certo, ${firstName}!` : 'Seu agendamento'}
          </h1>
          <p className="text-muted">
            {status === 'cancelled'
              ? `Este agendamento no ${appointment.business.business_name} foi cancelado.`
              : isNew && status === 'confirmed'
                ? `Seu horário foi confirmado no ${appointment.business.business_name}.`
                : `Agendamento no ${appointment.business.business_name}.`}
          </p>
        </header>

        <dl className="flex flex-col gap-4 rounded-panel bg-card p-6 shadow-soft">
          <div>
            <dt className="text-label-sm uppercase text-muted">Serviço</dt>
            <dd className="font-headline text-headline-sm text-ink">{appointment.service_name}</dd>
          </div>
          <div>
            <dt className="text-label-sm uppercase text-muted">Data e horário</dt>
            <dd className="text-ink">{formatLongDate(day)}</dd>
            <dd className="text-muted">
              {time} · {formatDuration(appointment.duration_minutes)}
            </dd>
          </div>
          <div>
            <dt className="text-label-sm uppercase text-muted">Valor</dt>
            <dd className="font-headline text-headline-sm text-brand">{formatPrice(appointment.price_cents)}</dd>
          </div>
          {appointment.business.address && (
            <div>
              <dt className="text-label-sm uppercase text-muted">Endereço</dt>
              <dd className="text-ink">{appointment.business.address}</dd>
            </div>
          )}
          <div>
            <dt className="text-label-sm uppercase text-muted">Contato</dt>
            <dd className="text-ink">{formatPhone(appointment.business.phone)}</dd>
          </div>
        </dl>

        {status === 'cancelled' && (
          <section className="flex flex-col items-center gap-3 rounded-card bg-container-low p-4 text-center">
            <p className="text-sm text-muted">O horário foi liberado. Você pode marcar um novo quando quiser.</p>
            <Link href="/" className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-label-lg text-on-brand">
              Fazer um novo agendamento
            </Link>
          </section>
        )}

        {canCancel(appointment, now) && <CancelAppointment token={token} />}

        <section aria-labelledby="link" className="flex flex-col gap-3 rounded-card bg-container-low p-4">
          <h2 id="link" className="font-headline text-headline-sm text-ink">
            Guarde este link
          </h2>
          <p className="text-sm text-muted">Você pode reabrir esta página a qualquer momento para conferir os dados do seu agendamento.</p>
          <p className="break-all rounded-card bg-card px-3 py-2 text-sm text-ink">{link}</p>
          <CopyLinkButton url={link} />
        </section>
      </main>
    </Shell>
  )
}
