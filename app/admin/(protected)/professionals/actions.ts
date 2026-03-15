'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const ProfessionalSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  bio: z.string().optional().nullable(),
})

type ProfessionalInput = z.infer<typeof ProfessionalSchema>
type ActionResult = { success: true } | { success: false; error: string }

export async function createProfessionalLogic(input: ProfessionalInput): Promise<ActionResult> {
  const parsed = ProfessionalSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'validation_error' }

  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('professionals')
    .insert({
      name: parsed.data.name,
      bio: parsed.data.bio ?? undefined,
      tenant_id: session.tenantId,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function createProfessional(input: ProfessionalInput): Promise<ActionResult> {
  const result = await createProfessionalLogic(input)
  if (result.success) revalidatePath('/admin/professionals')
  return result
}

export async function updateProfessionalLogic(
  id: string,
  input: ProfessionalInput
): Promise<ActionResult> {
  const parsed = ProfessionalSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'validation_error' }

  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('professionals')
    .update({
      name: parsed.data.name,
      bio: parsed.data.bio ?? undefined,
    })
    .eq('id', id)
    .eq('tenant_id', session.tenantId)
    .select('id')
    .single()

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function updateProfessional(
  id: string,
  input: ProfessionalInput
): Promise<ActionResult> {
  const result = await updateProfessionalLogic(id, input)
  if (result.success) revalidatePath('/admin/professionals')
  return result
}

export async function toggleProfessionalLogic(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('professionals')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('tenant_id', session.tenantId)
    .select('id')
    .single()

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function toggleProfessional(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const result = await toggleProfessionalLogic(id, isActive)
  if (result.success) revalidatePath('/admin/professionals')
  return result
}

export async function deleteProfessionalLogic(id: string): Promise<ActionResult> {
  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('professionals')
    .delete()
    .eq('id', id)
    .eq('tenant_id', session.tenantId)

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function deleteProfessional(id: string): Promise<ActionResult> {
  const result = await deleteProfessionalLogic(id)
  if (result.success) revalidatePath('/admin/professionals')
  return result
}
