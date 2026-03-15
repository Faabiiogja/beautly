'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const BusinessHourSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  open_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  close_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  is_open: z.boolean(),
}).refine(
  (v) => !v.is_open || (v.open_time != null && v.close_time != null && v.open_time < v.close_time),
  { message: 'validation_error' }
)

const ScheduleBlockSchema = z.object({
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  reason: z.string().optional().nullable(),
  professional_id: z.string().uuid().optional().nullable(),
})

type ActionResult = { success: true } | { success: false; error: string }

export async function upsertBusinessHourLogic(
  input: z.infer<typeof BusinessHourSchema>
): Promise<ActionResult> {
  const parsed = BusinessHourSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'validation_error' }

  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('business_hours')
    .upsert({
      ...parsed.data,
      tenant_id: session.tenantId,
    }, { onConflict: 'tenant_id,day_of_week' })

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function upsertBusinessHour(
  input: z.infer<typeof BusinessHourSchema>
): Promise<ActionResult> {
  const result = await upsertBusinessHourLogic(input)
  if (result.success) revalidatePath('/admin/schedule')
  return result
}

export async function createScheduleBlockLogic(
  input: z.infer<typeof ScheduleBlockSchema>
): Promise<ActionResult> {
  const parsed = ScheduleBlockSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'validation_error' }

  if (new Date(parsed.data.start_at) >= new Date(parsed.data.end_at)) {
    return { success: false, error: 'validation_error' }
  }

  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('schedule_blocks')
    .insert({
      ...parsed.data,
      tenant_id: session.tenantId,
    })

  if (error) return { success: false, error: 'db_error' }
  return { success: true }
}

export async function createScheduleBlock(
  input: z.infer<typeof ScheduleBlockSchema>
): Promise<ActionResult> {
  const result = await createScheduleBlockLogic(input)
  if (result.success) revalidatePath('/admin/schedule')
  return result
}

export async function deleteScheduleBlockLogic(id: string): Promise<ActionResult> {
  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('schedule_blocks')
    .delete()
    .eq('id', id)
    .eq('tenant_id', session.tenantId)
    .select('id')

  if (error) return { success: false, error: 'db_error' }
  if (!data?.length) return { success: false, error: 'not_found' }
  return { success: true }
}

export async function deleteScheduleBlock(id: string): Promise<ActionResult> {
  const result = await deleteScheduleBlockLogic(id)
  if (result.success) revalidatePath('/admin/schedule')
  return result
}
