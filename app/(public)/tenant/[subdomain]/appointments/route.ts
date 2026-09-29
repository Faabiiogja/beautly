import type { NextRequest } from 'next/server'
import { createBooking } from '@/lib/booking'
import { validateBooking } from '@/lib/booking-validation'
import { isSameOrigin, json } from '@/lib/http'

const MAX_BODY_BYTES = 4096

// POST /appointments  (no subdomínio do tenant, via rewrite do proxy)
// Corpo JSON: { serviceId, day, time, name, phone }. O tenant é o do subdomínio da requisição,
// nunca um campo do corpo. Responde só o token do link do agendamento.
export async function POST(request: NextRequest, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params

  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'unsupported_media_type' }, 415)
  // Barra formulários de outros sites (ver lib/http.ts).
  const origin = request.headers.get('origin')
  if (!isSameOrigin(origin, request.headers.get('host'))) return json({ error: 'forbidden' }, 403)
  // O corpo legítimo tem poucas centenas de bytes.
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return json({ error: 'payload_too_large' }, 413)

  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) return json({ error: 'payload_too_large' }, 413)
    body = JSON.parse(raw)
    if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object')
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  const text = (key: string) => (typeof body[key] === 'string' ? (body[key] as string) : '')
  const parsed = validateBooking({ serviceId: text('serviceId'), day: text('day'), time: text('time'), name: text('name'), phone: text('phone') })
  if (!parsed.ok) return json({ errors: parsed.errors }, 400)

  try {
    const result = await createBooking({ ...parsed.value, subdomain })
    if (result.status === 'created') return json({ token: result.token }, 201)
    if (result.status === 'slot_taken') return json({ error: 'slot_taken' }, 409)
    if (result.status === 'limit_reached') return json({ error: 'limit_reached' }, 429)
    return json({ error: 'not_found' }, 404)
  } catch (error) {
    console.error('appointments: falha ao criar agendamento', error)
    return json({ error: 'unavailable' }, 500)
  }
}
