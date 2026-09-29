import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { REASON } from '@/lib/auth/reasons'

// Sessão válida mas sem acesso ao painel (tenant inativo ou inexistente): encerra a sessão
// e volta ao login com mensagem neutra. Fica aqui porque só route handler consegue limpar cookies.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL(`/login?motivo=${REASON.unavailable}`, request.url))
}
