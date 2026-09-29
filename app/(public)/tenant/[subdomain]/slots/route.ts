import { NextResponse, type NextRequest } from 'next/server'
import { groupSlots } from '@/lib/availability'
import { loadSlots } from '@/lib/availability-data'
import { isRealDay } from '@/lib/dates'
import { isUuid } from '@/lib/ids'

const NO_STORE = { 'Cache-Control': 'no-store' }

// GET /slots?service=<uuid>&day=YYYY-MM-DD  (no subdomínio do tenant, via rewrite do proxy)
// Devolve só os horários livres, agrupados por período. Nunca expõe dados de clientes.
export async function GET(request: NextRequest, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const service = request.nextUrl.searchParams.get('service') ?? ''
  const day = request.nextUrl.searchParams.get('day') ?? ''
  if (!isUuid(service) || !isRealDay(day)) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400, headers: NO_STORE })
  }

  try {
    const result = await loadSlots({ subdomain, serviceId: service, day })
    if (result.status === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404, headers: NO_STORE })
    return NextResponse.json({ groups: groupSlots(result.slots) }, { headers: NO_STORE })
  } catch (error) {
    console.error('slots: falha ao calcular disponibilidade', error)
    return NextResponse.json({ error: 'unavailable' }, { status: 500, headers: NO_STORE })
  }
}
