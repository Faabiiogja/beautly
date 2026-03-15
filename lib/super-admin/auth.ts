// lib/super-admin/auth.ts
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET não configurado')
  return new TextEncoder().encode(secret)
}

/** Cria JWT com sub=super-admin, expira em 8h. */
export async function createJWT(): Promise<string> {
  return new SignJWT({ sub: 'super-admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

/** Verifica JWT. Retorna payload ou null se inválido/expirado. */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

/**
 * Verifica autenticação super admin a partir dos cookies.
 * Para uso em Server Components e layouts — redireciona se não autenticado.
 */
export async function requireSuperAdmin(): Promise<JWTPayload> {
  const cookieStore = await cookies()
  const token = cookieStore.get('sa_token')?.value
  if (!token) redirect('/super-admin/login')
  const payload = await verifyJWT(token)
  if (!payload) redirect('/super-admin/login')
  return payload
}

/**
 * Verifica autenticação super admin a partir dos cookies.
 * Para uso em Route Handlers — retorna null se não autenticado (sem redirect).
 */
export async function getSessionOrNull(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('sa_token')?.value
  if (!token) return null
  return verifyJWT(token)
}
