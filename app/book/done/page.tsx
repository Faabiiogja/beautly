import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { getBookingById } from '@/domain/bookings/queries'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ bookingId?: string }>
}

export default async function BookingDonePage({ searchParams }: PageProps) {
  const { bookingId } = await searchParams

  const tenant = await getCurrentTenant()

  if (!tenant) {
    notFound()
  }

  const booking = bookingId ? await getBookingById(bookingId, tenant.id) : null

  let devBookingUrl: string | null = null
  if (process.env.NODE_ENV === 'development' && bookingId) {
    const supabase = createSupabaseServiceClient()
    const { data: tokenRow } = await supabase
      .from('booking_tokens')
      .select('token')
      .eq('booking_id', bookingId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (tokenRow) {
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
      devBookingUrl = appDomain
        ? `https://${tenant.slug}.${appDomain}/b/${tokenRow.token}`
        : `http://localhost:3000/b/${tokenRow.token}`
    }
  }

  const slotLabel = booking
    ? new Intl.DateTimeFormat('pt-BR', {
        timeZone: tenant.timezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(booking.starts_at))
    : null

  const primary = tenant.primary_color ?? '#ec4899'

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
      <div className="mx-auto max-w-3xl px-6 w-full flex flex-col items-center gap-6">
        {/* Success icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 text-green-600"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">
            Agendamento confirmado!
          </h1>
          <p className="text-sm text-stone-500 leading-6">
            Em breve você recebe o link com os detalhes por WhatsApp.
          </p>
        </div>

        {/* Booking summary card */}
        {booking && slotLabel ? (
          <div className="w-full rounded-3xl border border-stone-200 bg-white p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Serviço
                </span>
                <span className="text-sm font-medium text-stone-900">
                  {booking.service.name}
                </span>
              </div>
              <div className="h-px bg-stone-100" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Profissional
                </span>
                <span className="text-sm font-medium text-stone-900">
                  {booking.professional.name}
                </span>
              </div>
              <div className="h-px bg-stone-100" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Data e hora
                </span>
                <span
                  className="text-sm font-medium capitalize"
                  style={{ color: primary }}
                >
                  {slotLabel}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Dev-only hint */}
        {process.env.NODE_ENV === 'development' && devBookingUrl ? (
          <div className="w-full rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-xs text-yellow-800 space-y-1">
            <p className="font-semibold">DEV: link do agendamento</p>
            <a href={devBookingUrl} className="break-all underline">{devBookingUrl}</a>
          </div>
        ) : null}

        {/* Back link */}
        <Link
          href="/"
          className="mt-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 underline underline-offset-4"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
