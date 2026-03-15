import { randomBytes } from 'crypto'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export function generateBookingToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createBookingToken(
  bookingId: string,
  endsAt: Date
): Promise<string> {
  const token = generateBookingToken()
  const expiresAt = new Date(endsAt.getTime() + 2 * 24 * 60 * 60 * 1000)
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase.from('booking_tokens').insert({
    booking_id: bookingId,
    token,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    throw new Error(`Failed to create booking token: ${error.message}`)
  }

  return token
}

export async function validateBookingToken(token: string) {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from('booking_tokens')
    .select(`
      *,
      booking:bookings(
        id, status, starts_at, ends_at, notes,
        service:services(id, name, duration_minutes, price),
        professional:professionals(id, name),
        customer:customers(id, name),
        tenant:tenants(id, name, primary_color)
      )
    `)
    .eq('token', token)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  return data ?? null
}
