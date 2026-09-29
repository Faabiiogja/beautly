import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { AppointmentView } from '@/components/public/AppointmentView'
import { Unavailable } from '@/components/public/Unavailable'
import { loadAppointment } from '@/lib/appointment-data'

// O link é individual: nunca indexar.
// O token vive na URL: sem Referer para não vazar caso a página um dia tenha links externos.
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' }

export default async function AppointmentPage({ params, searchParams }: PageProps<'/tenant/[subdomain]/agendamento/[token]'>) {
  const [{ subdomain, token }, { novo }] = await Promise.all([params, searchParams])
  const appointment = await loadAppointment(subdomain, token)
  // Token inexistente, de outro tenant ou de tenant inativo: mesma página genérica.
  if (!appointment) return <Unavailable />

  const h = await headers()
  const host = h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.includes('.localhost') ? 'http' : 'https')
  return <AppointmentView appointment={appointment} isNew={novo === '1'} link={`${proto}://${host}/agendamento/${token}`} />
}
