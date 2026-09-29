import type { NextRequest } from 'next/server'
import { cancelByToken } from '@/lib/cancellation'
import { isSameOrigin, json } from '@/lib/http'

// POST /agendamento/<token>/cancel  (no subdomínio do tenant, via rewrite do proxy)
// Quem tem o link cancela, sem login. O tenant é o do subdomínio; o token é o único segredo.
export async function POST(request: NextRequest, { params }: { params: Promise<{ subdomain: string; token: string }> }) {
  const { subdomain, token } = await params
  if (!isSameOrigin(request.headers.get('origin'), request.headers.get('host'))) return json({ error: 'forbidden' }, 403)

  try {
    const result = await cancelByToken(subdomain, token)
    if (result.status === 'cancelled') return json({ status: 'cancelled' }, 200)
    if (result.status === 'already_happened') return json({ error: 'already_happened' }, 409)
    return json({ error: 'not_found' }, 404)
  } catch (error) {
    console.error('cancel: falha ao cancelar agendamento', error)
    return json({ error: 'unavailable' }, 500)
  }
}
