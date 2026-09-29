import type { NextRequest } from 'next/server'
import { groupSlots } from '@/lib/availability'
import { loadSlots } from '@/lib/availability-data'
import { isRealDay } from '@/lib/dates'
import { json } from '@/lib/http'
import { isUuid } from '@/lib/ids'


// GET /slots?service=<uuid>&day=YYYY-MM-DD  (no subdomínio do tenant, via rewrite do proxy)
// Devolve só os horários livres, agrupados por período. Nunca expõe dados de clientes.
export async function GET(request: NextRequest, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const service = request.nextUrl.searchParams.get('service') ?? ''
  const day = request.nextUrl.searchParams.get('day') ?? ''
  if (!isUuid(service) || !isRealDay(day)) {
    return json({ error: 'invalid_params' }, 400)
  }

  try {
    const result = await loadSlots({ subdomain, serviceId: service, day })
    if (result.status === 'not_found') return json({ error: 'not_found' }, 404)
    return json({ groups: groupSlots(result.slots) })
  } catch (error) {
    console.error('slots: falha ao calcular disponibilidade', error)
    return json({ error: 'unavailable' }, 500)
  }
}
