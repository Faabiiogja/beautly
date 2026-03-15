'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getAvailableSlots } from '@/lib/availability'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { createBookingToken } from '@/lib/tokens'
import { getWhatsAppProvider } from '@/lib/whatsapp'
import type { ConfirmBookingResult } from '@/domain/bookings/types'

const confirmBookingSchema = z.object({
  serviceId: z.string().uuid(),
  professionalId: z.string().uuid(),
  slot: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      'Slot deve ser UTC ISO-8601 com Z'
    ),
  customerName: z.string().min(2, 'Nome obrigatorio'),
  customerPhone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Telefone deve ser E.164'),
})

type ConfirmBookingLogicInput = z.infer<typeof confirmBookingSchema>

export async function confirmBookingLogic(
  input: ConfirmBookingLogicInput
): Promise<ConfirmBookingResult> {
  const parsed = confirmBookingSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: 'validation_error',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { serviceId, professionalId, slot, customerName, customerPhone } =
    parsed.data
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return { success: false, error: 'server_error' }
  }

  const supabase = createSupabaseServiceClient()
  const [{ data: service }, { data: professional }] = await Promise.all([
    supabase
      .from('services')
      .select('id, duration_minutes, buffer_minutes, name')
      .eq('id', serviceId)
      .eq('tenant_id', tenant.id)
      .single(),
    supabase
      .from('professionals')
      .select('id, name')
      .eq('id', professionalId)
      .eq('tenant_id', tenant.id)
      .single(),
  ])

  if (!service || !professional) {
    return { success: false, error: 'validation_error' }
  }

  const availableSlots = await getAvailableSlots({
    tenantId: tenant.id,
    professionalId,
    serviceId,
    date: slot.slice(0, 10),
    timezone: tenant.timezone,
  })

  if (!availableSlots.includes(slot)) {
    return { success: false, error: 'slot_unavailable' }
  }

  const endsAt = new Date(
    new Date(slot).getTime() +
      (service.duration_minutes + service.buffer_minutes) * 60 * 1000
  )

  await supabase.from('customers').insert({
    tenant_id: tenant.id,
    name: customerName,
    phone: customerPhone,
  })

  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('phone', customerPhone)
    .single()

  if (!existingCustomer) {
    return { success: false, error: 'server_error' }
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      tenant_id: tenant.id,
      customer_id: existingCustomer.id,
      service_id: serviceId,
      professional_id: professionalId,
      starts_at: slot,
      ends_at: endsAt.toISOString(),
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (bookingError || !booking) {
    return { success: false, error: 'slot_unavailable' }
  }

  const token = await createBookingToken(booking.id, endsAt)
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
  const bookingUrl = appDomain
    ? `https://${tenant.slug}.${appDomain}/b/${token}`
    : `http://localhost:3000/b/${token}`

  await getWhatsAppProvider().sendBookingConfirmation(
    customerPhone,
    bookingUrl,
    tenant.name,
    service.name,
    slot
  )

  return { success: true, bookingId: booking.id }
}

export async function confirmBooking(
  _prevState: ConfirmBookingResult | null,
  formData: FormData
): Promise<ConfirmBookingResult> {
  const result = await confirmBookingLogic({
    serviceId: String(formData.get('serviceId') ?? ''),
    professionalId: String(formData.get('professionalId') ?? ''),
    slot: String(formData.get('slot') ?? ''),
    customerName: String(formData.get('customerName') ?? ''),
    customerPhone: String(formData.get('customerPhone') ?? ''),
  })

  if (result.success && result.bookingId) {
    redirect(`/book/done?bookingId=${result.bookingId}`)
  }

  return result
}
