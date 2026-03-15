// app/api/super-admin/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createJWT } from '@/lib/super-admin/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }

  const expectedEmail = process.env.SUPER_ADMIN_EMAIL
  const expectedHash = process.env.SUPER_ADMIN_PASSWORD_HASH

  if (
    !email ||
    !password ||
    !expectedEmail ||
    !expectedHash ||
    email !== expectedEmail ||
    !(await bcrypt.compare(password, expectedHash))
  ) {
    return NextResponse.json(
      { error: 'Credenciais inválidas' },
      { status: 401 }
    )
  }

  const token = await createJWT()

  const res = NextResponse.json({ ok: true })
  res.cookies.set('sa_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
