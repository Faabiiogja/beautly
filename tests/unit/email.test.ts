import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendEmail } from '@/lib/email'

const mail = { to: 'ana@example.com', subject: 'Olá', text: 'oi', html: '<p>oi</p>', idempotencyKey: 'appointment-created-abc' }
let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('RESEND_API_KEY', 're_test_123')
  vi.stubEnv('EMAIL_FROM', 'Beautly <agenda@beautly.cloud>')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('sendEmail (Resend)', () => {
  it('envia para a API do Resend com chave, remetente, destinatário e idempotência', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'em_1' }), { status: 200 }))
    const result = await sendEmail(mail)

    expect(result).toEqual({ status: 'sent', id: 'em_1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer re_test_123')
    expect(init.headers['Idempotency-Key']).toBe('appointment-created-abc')
    expect(JSON.parse(init.body)).toEqual({
      from: 'Beautly <agenda@beautly.cloud>',
      to: ['ana@example.com'],
      subject: 'Olá',
      text: 'oi',
      html: '<p>oi</p>',
    })
  })

  it('sem chave configurada não tenta enviar e não falha', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    expect(await sendEmail(mail)).toEqual({ status: 'skipped', reason: 'RESEND_API_KEY ausente' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sem remetente configurado não envia', async () => {
    vi.stubEnv('EMAIL_FROM', '')
    expect(await sendEmail(mail)).toEqual({ status: 'skipped', reason: 'EMAIL_FROM ausente' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('erro da API vira resultado "failed", nunca exceção', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'domain not verified' }), { status: 403 }))
    const result = await sendEmail(mail)
    expect(result.status).toBe('failed')
    expect(result.status === 'failed' && result.error).toContain('403')
  })

  it('falha de rede vira "failed", nunca exceção', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNRESET'))
    expect(await sendEmail(mail)).toMatchObject({ status: 'failed' })
  })

  it('demora demais vira "failed" (não trava a resposta)', async () => {
    fetchMock.mockImplementationOnce((_url: string, init: RequestInit) => new Promise((_res, rej) => init.signal?.addEventListener('abort', () => rej(new Error('aborted')))))
    const result = await sendEmail({ ...mail, timeoutMs: 20 })
    expect(result.status).toBe('failed')
  })

  it('não vaza a chave nos logs de erro', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    await sendEmail(mail)
    const logged = JSON.stringify((console.error as unknown as ReturnType<typeof vi.fn>).mock.calls)
    expect(logged).not.toContain('re_test_123')
  })
})
