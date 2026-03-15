// app/api/super-admin/tenants/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrNull } from '@/lib/super-admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const payload = await getSessionOrNull()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, monthly_price, status, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tenants: data })
}

export async function POST(req: NextRequest) {
  const payload = await getSessionOrNull()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { name, slug, monthly_price } = body as {
    name?: string
    slug?: string
    monthly_price?: number
  }

  if (!name || !slug) {
    return NextResponse.json({ error: 'name e slug são obrigatórios' }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'Slug deve conter apenas letras minúsculas, números e hífens' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseServiceClient()

  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 409 })
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      monthly_price: monthly_price ?? 99.90,
      primary_color: '#ec4899',
      timezone: 'America/Sao_Paulo',
      status: 'active',
    })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: tenantError?.message ?? 'Erro ao criar tenant' }, { status: 500 })
  }

  const { error: profError } = await supabase
    .from('professionals')
    .insert({
      tenant_id: tenant.id,
      name: 'Profissional',
      is_active: true,
      sort_order: 0,
    })

  if (profError) {
    await supabase.from('tenants').delete().eq('id', tenant.id)
    return NextResponse.json({ error: 'Erro ao criar profissional padrão' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: tenant.id }, { status: 201 })
}
