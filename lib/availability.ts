import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

interface GenerateSlotsParams {
  openTime: string
  closeTime: string
  slotDurationMinutes: number
  dateInTz: Date
  timezone: string
}

interface TimeRange {
  starts_at?: string
  ends_at?: string
  start_at?: string
  end_at?: string
}

function getDateStringInTimeZone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd')
}

function getDayOfWeek(date: Date, timezone: string): number {
  const day = formatInTimeZone(date, timezone, 'i')
  return Number(day) % 7
}

export function generateSlots({
  openTime,
  closeTime,
  slotDurationMinutes,
  dateInTz,
  timezone,
}: GenerateSlotsParams): string[] {
  const slots: string[] = []
  const dateString = getDateStringInTimeZone(dateInTz, timezone)
  const [openHour, openMinute] = openTime.split(':').map(Number)
  const [closeHour, closeMinute] = closeTime.split(':').map(Number)
  const openMinutes = openHour * 60 + openMinute
  const closeMinutes = closeHour * 60 + closeMinute

  let currentMinutes = openMinutes

  while (currentMinutes + slotDurationMinutes <= closeMinutes) {
    const hour = String(Math.floor(currentMinutes / 60)).padStart(2, '0')
    const minute = String(currentMinutes % 60).padStart(2, '0')
    const utcDate = fromZonedTime(`${dateString} ${hour}:${minute}`, timezone)

    slots.push(utcDate.toISOString())
    currentMinutes += slotDurationMinutes
  }

  return slots
}

export function filterAvailableSlots(
  slots: string[],
  bookings: Array<Pick<Required<TimeRange>, 'starts_at' | 'ends_at'>>,
  blocks: Array<Pick<Required<TimeRange>, 'start_at' | 'end_at'>>,
  now: Date
): string[] {
  return slots.filter((slot) => {
    const slotTime = new Date(slot).getTime()

    if (slotTime <= now.getTime()) {
      return false
    }

    const bookingConflict = bookings.some((booking) => {
      const bookingStart = new Date(booking.starts_at).getTime()
      const bookingEnd = new Date(booking.ends_at).getTime()

      return bookingStart <= slotTime && slotTime < bookingEnd
    })

    if (bookingConflict) {
      return false
    }

    const blockConflict = blocks.some((block) => {
      const blockStart = new Date(block.start_at).getTime()
      const blockEnd = new Date(block.end_at).getTime()

      return blockStart <= slotTime && slotTime < blockEnd
    })

    return !blockConflict
  })
}

export interface GetAvailableSlotsParams {
  tenantId: string
  professionalId: string
  serviceId: string
  date: string
  timezone: string
}

export async function getAvailableSlots({
  tenantId,
  professionalId,
  serviceId,
  date,
  timezone,
}: GetAvailableSlotsParams): Promise<string[]> {
  const supabase = createSupabaseServiceClient()
  const dateAtNoon = fromZonedTime(`${date} 12:00`, timezone)
  const dayOfWeek = getDayOfWeek(dateAtNoon, timezone)

  const [{ data: businessHours, error: businessHoursError }, { data: service, error: serviceError }] =
    await Promise.all([
      supabase
        .from('business_hours')
        .select('is_open, open_time, close_time')
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle(),
      supabase
        .from('services')
        .select('duration_minutes, buffer_minutes')
        .eq('tenant_id', tenantId)
        .eq('id', serviceId)
        .eq('is_active', true)
        .maybeSingle(),
    ])

  if (businessHoursError) {
    throw new Error(`Failed to load business hours: ${businessHoursError.message}`)
  }

  if (serviceError) {
    throw new Error(`Failed to load service: ${serviceError.message}`)
  }

  if (
    !businessHours ||
    !businessHours.is_open ||
    !businessHours.open_time ||
    !businessHours.close_time ||
    !service
  ) {
    return []
  }

  const slotDurationMinutes =
    service.duration_minutes + (service.buffer_minutes ?? 0)

  const dayStart = fromZonedTime(`${date} 00:00`, timezone).toISOString()
  const nextDateInTimezone = getDateStringInTimeZone(
    new Date(dateAtNoon.getTime() + 24 * 60 * 60 * 1000),
    timezone
  )
  const dayEnd = fromZonedTime(`${nextDateInTimezone} 00:00`, timezone).toISOString()

  const [{ data: bookings, error: bookingsError }, { data: blocks, error: blocksError }] =
    await Promise.all([
      supabase
        .from('bookings')
        .select('starts_at, ends_at')
        .eq('tenant_id', tenantId)
        .eq('professional_id', professionalId)
        .in('status', ['confirmed', 'completed'])
        .gte('starts_at', dayStart)
        .lt('starts_at', dayEnd),
      supabase
        .from('schedule_blocks')
        .select('start_at, end_at')
        .eq('tenant_id', tenantId)
        .or(`professional_id.is.null,professional_id.eq.${professionalId}`)
        .lt('start_at', dayEnd)
        .gt('end_at', dayStart),
    ])

  if (bookingsError) {
    throw new Error(`Failed to load bookings: ${bookingsError.message}`)
  }

  if (blocksError) {
    throw new Error(`Failed to load schedule blocks: ${blocksError.message}`)
  }

  const generatedSlots = generateSlots({
    openTime: businessHours.open_time.slice(0, 5),
    closeTime: businessHours.close_time.slice(0, 5),
    slotDurationMinutes,
    dateInTz: dateAtNoon,
    timezone,
  })

  return filterAvailableSlots(
    generatedSlots,
    bookings ?? [],
    blocks ?? [],
    new Date()
  )
}
