'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const SettingsSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
})

type ActionResult = { success: true } | { success: false; error: string }

export async function updateSettingsLogic(
  input: z.infer<typeof SettingsSchema>
): Promise<ActionResult> {
  const parsed = SettingsSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'validation_error' }

  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('tenants')
    .update({ name: parsed.data.name, primary_color: parsed.data.primary_color })
    .eq('id', session.tenantId)

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function updateSettings(
  input: z.infer<typeof SettingsSchema>
): Promise<ActionResult> {
  const result = await updateSettingsLogic(input)
  if (result.success) {
    revalidatePath('/admin/settings')
    revalidateTag('tenant-by-slug')
  }
  return result
}
