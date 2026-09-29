import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { REASON } from '@/lib/auth/reasons'

// Destino do link do e-mail de "esqueci minha senha" (fluxo PKCE do Supabase Auth):
// troca o código por uma sessão e leva à tela de nova senha.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL('/redefinir-senha', request.url))
  }
  return NextResponse.redirect(new URL(`/esqueci-senha?motivo=${REASON.invalidLink}`, request.url))
}
