import type { Database } from '@/types/database'

export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type BookingToken = Database['public']['Tables']['booking_tokens']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Professional = Database['public']['Tables']['professionals']['Row']

export interface BookingWithDetails {
  id: string
  status: string
  starts_at: string
  ends_at: string
  notes: string | null
  service: Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price'>
  professional: Pick<Professional, 'id' | 'name'>
  customer: Pick<Customer, 'id' | 'name'>
  tenant: { id: string; name: string; primary_color: string | null }
}

export interface ConfirmBookingInput {
  tenantId: string
  serviceId: string
  professionalId: string
  slot: string
  customerName: string
  customerPhone: string
}

export interface ConfirmBookingResult {
  success: boolean
  bookingId?: string
  error?: 'slot_unavailable' | 'validation_error' | 'server_error'
  fieldErrors?: Record<string, string[]>
}
