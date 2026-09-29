import { NextResponse } from 'next/server'

// Respostas das rotas públicas nunca são cacheadas: refletem o estado atual da agenda.
export const NO_STORE = { 'Cache-Control': 'no-store' }
export const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: NO_STORE })

// Rotas públicas que criam ou alteram dados: o browser informa a origem da requisição, e ela tem que ser
// o próprio host. "Origin: null" (iframe com sandbox, data:) e valores que não são URL são recusados.
// Sem cabeçalho Origin (curl, scripts) passa: isto barra formulários de outros sites, não é autenticação.
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (origin === null) return true
  if (!host) return false
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase()
  } catch {
    return false
  }
}
