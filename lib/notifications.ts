import { formatLongDate, toLocalDayAndTime } from '@/lib/dates'
import { formatPrice } from '@/lib/format'
import { formatPhone } from '@/lib/phone'

export type EmailAppointment = {
  clientName: string
  clientPhone: string
  serviceName: string
  priceCents: number
  startTime: string // instante UTC (ISO)
  businessName: string
  panelUrl: string
}

export type AppointmentEmailKind = 'created' | 'cancelled'

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Assunto em uma linha só: quebra de linha viraria injeção de cabeçalho.
const oneLine = (value: string) => value.replace(/[\r\n\u2028\u2029]+/g, ' ').trim()

// "2026-10-05" -> "05/10"
const shortDate = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`

// E-mail para a profissional quando a cliente agenda ou cancela. Só o necessário para agir: quem, quando,
// o quê e o telefone. Nada do token do link da cliente.
export function buildAppointmentEmail(kind: AppointmentEmailKind, a: EmailAppointment): { subject: string; text: string; html: string } {
  const { day, time } = toLocalDayAndTime(new Date(a.startTime))
  const when = `${formatLongDate(day)} às ${time}`
  const cancelled = kind === 'cancelled'

  const subject = oneLine(
    `${cancelled ? 'Agendamento cancelado' : 'Novo agendamento'}: ${a.clientName}, ${shortDate(day)} às ${time}, ${a.serviceName}`,
  )
  const headline = cancelled ? 'Uma cliente cancelou o agendamento' : 'Você tem um novo agendamento'
  const footer = cancelled ? 'O horário foi liberado na sua agenda para novas clientes.' : 'Ele já aparece na sua agenda.'

  const rows: [string, string][] = [
    ['Cliente', a.clientName],
    ['Telefone', formatPhone(a.clientPhone)],
    ['Serviço', a.serviceName],
    ['Data e horário', when],
    ['Valor', formatPrice(a.priceCents)],
  ]

  const text = [
    `${headline} — ${a.businessName}`,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    footer,
    `Ver sua agenda: ${a.panelUrl}`,
  ].join('\n')

  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#faf7f5;font-family:Arial,Helvetica,sans-serif;color:#2a2622">
<div style="max-width:480px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 4px">${escapeHtml(headline)}</h1>
<p style="margin:0 0 16px;color:#756f68">${escapeHtml(a.businessName)}</p>
<table role="presentation" style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:10px 14px;color:#756f68;width:38%">${escapeHtml(label)}</td><td style="padding:10px 14px">${escapeHtml(value)}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="margin:16px 0">${escapeHtml(footer)}</p>
<p style="margin:0"><a href="${escapeHtml(a.panelUrl)}" style="color:#99462a">Ver sua agenda</a></p>
<p style="margin:16px 0 0;font-size:12px;color:#756f68">${escapeHtml(a.panelUrl)}</p>
</div></body></html>`

  return { subject, text, html }
}
