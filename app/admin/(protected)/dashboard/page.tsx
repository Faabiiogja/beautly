import { CalendarDays } from 'lucide-react'
import { requireAdmin } from '@/lib/admin/auth'
import { getCurrentTenant } from '@/lib/tenant'
import { getBookingsByDate } from '@/domain/bookings/queries'
import type { BookingWithDetails } from '@/domain/bookings/types'

export default async function DashboardPage() {
  const { tenantId } = await requireAdmin()

  const tenant = await getCurrentTenant()
  const timezone = tenant?.timezone ?? 'America/Sao_Paulo'

  const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: timezone }).format(new Date())

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const bookings = await getBookingsByDate(tenantId, todayStr, timezone)

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
          <p className="mt-1 text-sm capitalize text-stone-500">{todayFormatted}</p>
        </div>

        {/* Booking list or empty state */}
        {bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} timezone={timezone} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function BookingCard({
  booking,
  timezone,
}: {
  booking: BookingWithDetails
  timezone: string
}) {
  const timeLabel = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(booking.starts_at))

  return (
    <li className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
      {/* Time */}
      <span className="min-w-[48px] text-lg font-bold text-pink-500">{timeLabel}</span>

      {/* Details */}
      <div className="flex-1">
        <p className="font-semibold text-stone-800">{booking.customer.name}</p>
        <p className="text-sm text-stone-500">{booking.service.name}</p>
        <p className="text-xs text-stone-400">{booking.professional.name}</p>
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
      <CalendarDays className="mb-4 h-12 w-12 text-stone-300" strokeWidth={1.5} />
      <p className="text-base font-medium text-stone-500">Nenhum agendamento hoje</p>
    </div>
  )
}
