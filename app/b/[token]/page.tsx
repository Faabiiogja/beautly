export const dynamic = 'force-dynamic'

import { getBookingByToken } from '@/domain/bookings/queries'
import { getCurrentTenant } from '@/lib/tenant'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:   { label: 'Confirmado',  color: '#16a34a', bg: '#dcfce7' },
  cancelled:   { label: 'Cancelado',   color: '#dc2626', bg: '#fee2e2' },
  rescheduled: { label: 'Reagendado',  color: '#d97706', bg: '#fef3c7' },
  completed:   { label: 'Concluído',   color: '#6b7280', bg: '#f3f4f6' },
}

export default async function BookingTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const booking = await getBookingByToken(token)

  if (!booking) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <div className="mx-auto max-w-sm px-6 py-10 text-center">
          <h1 className="text-xl font-semibold text-stone-800">Link não disponível</h1>
          <p className="mt-2 text-sm text-stone-500">
            Este link não está mais disponível ou expirou.
          </p>
        </div>
      </div>
    )
  }

  const tenant = await getCurrentTenant()
  const timezone =
    (tenant as { timezone?: string } | null)?.timezone ?? 'America/Sao_Paulo'

  const primary =
    booking.tenant.primary_color ?? tenant?.primary_color ?? '#ec4899'

  const startsAt = new Date(booking.starts_at)

  const slotLabel = startsAt
    .toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timezone,
    })
    .replace(/^\w/, (c) => c.toUpperCase())

  const timeLabel = startsAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  })

  const status = STATUS_LABEL[booking.status] ?? {
    label: booking.status,
    color: '#6b7280',
    bg: '#f3f4f6',
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center">
      <div className="mx-auto max-w-sm px-6 py-10 w-full">
        <p
          className="mb-4 text-xs font-bold uppercase tracking-widest"
          style={{ color: primary }}
        >
          {booking.tenant.name}
        </p>

        <div className="rounded-3xl border border-stone-200 bg-white p-6">
          {/* Status badge */}
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-4"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            {status.label}
          </span>

          {/* Service name */}
          <h1 className="text-2xl font-bold text-stone-900">{booking.service.name}</h1>

          {/* Professional */}
          <p className="mt-1 text-sm text-stone-500">com {booking.professional.name}</p>

          <hr className="my-4 border-stone-100" />

          {/* Details rows */}
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Data</dt>
              <dd className="font-medium text-stone-800 text-right">{slotLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Horário</dt>
              <dd className="font-medium text-stone-800">{timeLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Duração</dt>
              <dd className="font-medium text-stone-800">
                {booking.service.duration_minutes} min
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          Dúvidas? Entre em contato com o salão.
        </p>
      </div>
    </div>
  )
}
