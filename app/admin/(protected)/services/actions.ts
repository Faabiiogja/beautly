'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const ServiceSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  duration_minutes: z.number().int().min(1, 'Duração deve ser pelo menos 1 minuto'),
  price: z.number().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
})

type ServiceInput = z.infer<typeof ServiceSchema>
type ActionResult = { success: true } | { success: false; error: string }

export async function createServiceLogic(input: ServiceInput): Promise<ActionResult> {
  const parsed = ServiceSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'validation_error' }

  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('services')
    .insert({
      name: parsed.data.name,
      duration_minutes: parsed.data.duration_minutes,
      price: parsed.data.price ?? undefined,
      description: parsed.data.description ?? undefined,
      tenant_id: session.tenantId,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function createService(input: ServiceInput): Promise<ActionResult> {
  const result = await createServiceLogic(input)
  if (result.success) revalidatePath('/admin/services')
  return result
}

export async function updateServiceLogic(
  id: string,
  input: ServiceInput
): Promise<ActionResult> {
  const parsed = ServiceSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'validation_error' }

  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('services')
    .update({
      name: parsed.data.name,
      duration_minutes: parsed.data.duration_minutes,
      price: parsed.data.price ?? undefined,
      description: parsed.data.description ?? undefined,
    })
    .eq('id', id)
    .eq('tenant_id', session.tenantId)
    .select('id')
    .single()

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function updateService(
  id: string,
  input: ServiceInput
): Promise<ActionResult> {
  const result = await updateServiceLogic(id, input)
  if (result.success) revalidatePath('/admin/services')
  return result
}

export async function toggleServiceLogic(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('services')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('tenant_id', session.tenantId)
    .select('id')
    .single()

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function toggleService(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const result = await toggleServiceLogic(id, isActive)
  if (result.success) revalidatePath('/admin/services')
  return result
}

export async function deleteServiceLogic(id: string): Promise<ActionResult> {
  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('tenant_id', session.tenantId)

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function deleteService(id: string): Promise<ActionResult> {
  const result = await deleteServiceLogic(id)
  if (result.success) revalidatePath('/admin/services')
  return result
}
