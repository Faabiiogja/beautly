import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/availability'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const professionalId = request.nextUrl.searchParams.get('professionalId')
  const serviceId = request.nextUrl.searchParams.get('serviceId')
  const date = request.nextUrl.searchParams.get('date')

  if (!professionalId || !serviceId || !date) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()
  const [{ data: professional }, { data: service }] = await Promise.all([
    supabase
      .from('professionals')
      .select('id')
      .eq('id', professionalId)
      .eq('tenant_id', tenant.id)
      .single(),
    supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('tenant_id', tenant.id)
      .single(),
  ])

  if (!professional || !service) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 400 })
  }

  try {
    const slots = await getAvailableSlots({
      tenantId: tenant.id,
      professionalId,
      serviceId,
      date,
      timezone: tenant.timezone,
    })
    return NextResponse.json({ slots })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}
