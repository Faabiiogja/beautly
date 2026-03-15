// app/api/super-admin/tenants/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrNull } from '@/lib/super-admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getSessionOrNull()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { status } = body as { status?: string }

  if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const { error } = await supabase
    .from('tenants')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getSessionOrNull()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
