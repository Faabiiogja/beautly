import { fromZonedTime } from 'date-fns-tz'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { BookingWithDetails } from '@/domain/bookings/types'

const BOOKING_WITH_DETAILS_SELECT = `
  id, status, starts_at, ends_at, notes,
  service:services(id, name, duration_minutes, price),
  professional:professionals(id, name),
  customer:customers(id, name),
  tenant:tenants(id, name, primary_color)
` as const

export async function getBookingByToken(
  token: string
): Promise<BookingWithDetails | null> {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from('booking_tokens')
    .select(`booking:bookings(${BOOKING_WITH_DETAILS_SELECT})`)
    .eq('token', token)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data?.booking) {
    return null
  }

  return data.booking as unknown as BookingWithDetails
}

export async function getBookingById(
  bookingId: string,
  tenantId: string
): Promise<BookingWithDetails | null> {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_DETAILS_SELECT)
    .eq('id', bookingId)
    .eq('tenant_id', tenantId)
    .single()

  if (!data) {
    return null
  }

  return data as unknown as BookingWithDetails
}

export async function getBookingsByDate(
  tenantId: string,
  date: string,
  timezone: string
): Promise<BookingWithDetails[]> {
  const supabase = createSupabaseServiceClient()
  const dayStart = fromZonedTime(`${date}T00:00:00`, timezone).toISOString()
  const dayEnd = fromZonedTime(`${date}T23:59:59.999`, timezone).toISOString()
  const { data } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_DETAILS_SELECT)
    .eq('tenant_id', tenantId)
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)
    .order('starts_at')

  return (data ?? []) as unknown as BookingWithDetails[]
}
