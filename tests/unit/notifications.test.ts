import { describe, expect, it } from 'vitest'
import { buildAppointmentEmail, escapeHtml, type EmailAppointment } from '@/lib/notifications'

const appt: EmailAppointment = {
  clientName: 'Maria da Silva',
  clientPhone: '11999990000',
  serviceName: 'Manicure',
  priceCents: 5000,
  startTime: '2026-10-05T17:00:00.000Z', // 14:00 em São Paulo
  businessName: 'Studio da Ana',
  panelUrl: 'https://painel.beautly.cloud/agendamentos',
}

describe('buildAppointmentEmail', () => {
  it('novo agendamento: assunto com cliente, data, hora e serviço', () => {
    const mail = buildAppointmentEmail('created', appt)
    expect(mail.subject).toBe('Novo agendamento: Maria da Silva, 05/10 às 14:00, Manicure')
  })

  it('cancelamento pela cliente: assunto deixa claro que foi cancelado', () => {
    const mail = buildAppointmentEmail('cancelled', appt)
    expect(mail.subject).toBe('Agendamento cancelado: Maria da Silva, 05/10 às 14:00, Manicure')
  })

  it('o corpo traz cliente, telefone formatado, serviço, valor, data/hora locais e o link do painel', () => {
    for (const kind of ['created', 'cancelled'] as const) {
      const { text, html } = buildAppointmentEmail(kind, appt)
      for (const part of ['Maria da Silva', '(11) 99999-0000', 'Manicure', 'R$', '14:00', 'segunda-feira', appt.panelUrl]) {
        expect(text.toLowerCase()).toContain(part.toLowerCase())
        expect(html.toLowerCase()).toContain(part.toLowerCase())
      }
    }
  })

  it('o cancelamento avisa que o horário foi liberado', () => {
    expect(buildAppointmentEmail('cancelled', appt).text).toContain('liberado')
    expect(buildAppointmentEmail('created', appt).text).not.toContain('liberado')
  })

  it('escapa HTML vindo da cliente (nome e serviço) no corpo em HTML', () => {
    const { html } = buildAppointmentEmail('created', { ...appt, clientName: '<img src=x onerror=alert(1)>', serviceName: 'A & B "C"' })
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('A &amp; B &quot;C&quot;')
  })

  it('o assunto nunca leva quebra de linha (injeção de cabeçalho)', () => {
    const { subject } = buildAppointmentEmail('created', { ...appt, clientName: 'Maria\r\nBcc: alguem@evil.example' })
    expect(subject).not.toMatch(/[\r\n]/)
  })

  it('não inclui o token do agendamento nem dados além dos necessários', () => {
    const { text, html } = buildAppointmentEmail('created', appt)
    expect(text + html).not.toMatch(/token/i)
  })
})

describe('escapeHtml', () => {
  it('escapa os cinco caracteres especiais', () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;')
  })
})
