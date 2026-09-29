import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppointmentView, displayStatus } from '@/components/public/AppointmentView'
import type { AppointmentView as Appointment } from '@/lib/appointment-data'

const appointment: Appointment = {
  status: 'confirmed',
  service_name: 'Manicure',
  price_cents: 5000,
  duration_minutes: 60,
  client_name: 'Maria da Silva',
  start_time: '2026-10-05T13:30:00.000Z', // 10:30 em São Paulo
  end_time: '2026-10-05T14:30:00.000Z',
  business: { business_name: 'Studio da Ana', phone: '11999990000', address: 'Rua das Flores, 10' },
}
const before = new Date('2026-10-01T12:00:00Z')
const after = new Date('2026-10-06T12:00:00Z')
const link = 'https://ana.beautly.cloud/agendamento/abc'
const html = (over: Partial<Appointment> = {}, isNew = false, now = before) =>
  renderToStaticMarkup(<AppointmentView appointment={{ ...appointment, ...over }} isNew={isNew} link={link} now={now} />)

describe('displayStatus', () => {
  it('confirmado futuro, confirmado que já passou e cancelado', () => {
    expect(displayStatus(appointment, before)).toBe('confirmed')
    expect(displayStatus(appointment, after)).toBe('past')
    expect(displayStatus({ ...appointment, status: 'cancelled' }, before)).toBe('cancelled')
    expect(displayStatus({ ...appointment, status: 'cancelled' }, after)).toBe('cancelled')
  })
})

describe('AppointmentView', () => {
  it('mostra os detalhes no horário de São Paulo, com o link', () => {
    const out = html()
    for (const text of ['Manicure', '10:30', '05/10/2026', '1h', 'Rua das Flores, 10', '(11) 99999-0000', link, 'Copiar link do agendamento']) {
      expect(out).toContain(text)
    }
    expect(out).toContain('R$')
  })

  it('logo após criar, cumprimenta pelo primeiro nome', () => {
    expect(html({}, true)).toContain('Tudo certo, Maria!')
    expect(html({}, false)).not.toContain('Tudo certo')
  })

  it('cancelado e já ocorrido mostram o estado real, sem cumprimento', () => {
    expect(html({ status: 'cancelled' }, true)).toContain('Cancelado')
    expect(html({ status: 'cancelled' }, true)).not.toContain('Tudo certo')
    expect(html({}, true, after)).toContain('Já aconteceu')
  })

  it('não expõe o telefone da cliente, só o do estúdio', () => {
    expect(html({}, true)).not.toContain('11988887777')
  })
})
