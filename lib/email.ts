export type EmailInput = {
  to: string
  subject: string
  text: string
  html: string
  // evita e-mail duplicado se a mesma notificação for tentada duas vezes
  idempotencyKey?: string
  timeoutMs?: number
}

export type EmailResult =
  | { status: 'sent'; id: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string }

const RESEND_URL = 'https://api.resend.com/emails'
const DEFAULT_TIMEOUT_MS = 8000

// Envia um e-mail transacional pela API HTTP do Resend. Nunca lança: o envio é um efeito colateral e
// uma falha aqui não pode impedir o agendamento nem o cancelamento. Sem chave/remetente, apenas pula.
export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey) {
    console.warn('email: RESEND_API_KEY ausente, e-mail não enviado')
    return { status: 'skipped', reason: 'RESEND_API_KEY ausente' }
  }
  if (!from) {
    console.warn('email: EMAIL_FROM ausente, e-mail não enviado')
    return { status: 'skipped', reason: 'EMAIL_FROM ausente' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  try {
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(input.idempotencyKey ? { 'Idempotency-Key': input.idempotencyKey } : {}),
      },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text, html: input.html }),
    })
    if (!response.ok) {
      // só o status: o corpo da resposta pode ecoar dados do pedido
      const error = `Resend respondeu ${response.status}`
      console.error('email: falha no envio', error)
      return { status: 'failed', error }
    }
    const body: { id?: string } = await response.json().catch(() => ({}))
    return { status: 'sent', id: body.id ?? '' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido'
    console.error('email: falha no envio', message)
    return { status: 'failed', error: message }
  } finally {
    clearTimeout(timer)
  }
}
