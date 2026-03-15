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

