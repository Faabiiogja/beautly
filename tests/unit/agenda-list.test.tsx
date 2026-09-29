import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { AgendaList } from '@/app/(painel)/agendamentos/AgendaList'
import { groupByDay, type AgendaItem } from '@/lib/agenda'

vi.mock('@/app/(painel)/agendamentos/actions', () => ({ cancelAppointment: () => {} }))

const now = new Date('2026-10-01T12:00:00Z')
const item = (id: string, startZ: string, over: Partial<AgendaItem> = {}): AgendaItem => ({
  id,
  status: 'confirmed',
  service_name: 'Manicure',
  price_cents: 5000,
  duration_minutes: 60,
  client_name: `Cliente ${id}`,
  client_phone: '11999990000',
  start_time: startZ,
  end_time: new Date(new Date(startZ).getTime() + 3_600_000).toISOString(),
  ...over,
})

const render = (items: AgendaItem[], blocked: string[] = []) =>
  renderToStaticMarkup(<AgendaList groups={groupByDay(items, '2026-10-01')} blockedDays={new Set(blocked)} now={now} />)

describe('AgendaList', () => {
  it('mostra data (grupo), hora local, cliente, serviço, valor e status', () => {
    const out = render([item('a', '2026-10-05T13:30:00Z')]) // 10:30 em São Paulo
    for (const text of ['Segunda, 05/10', '10:30', 'Cliente a', '(11) 99999-0000', 'Manicure', 'Confirmado', '1h']) {
      expect(out).toContain(text)
    }
    expect(out).toContain('R$')
    expect(out).toContain('<article')
  })

  it('agrupa cada dia numa seção própria, com o rótulo do dia como cabeçalho (uma vez por dia)', () => {
    const out = render([item('a', '2026-10-05T12:00:00Z'), item('c', '2026-10-06T13:00:00Z')])
    expect(out.match(/<section[^>]*aria-labelledby="dia-2026-10-05"/g)).toHaveLength(1)
    expect(out.match(/<section[^>]*aria-labelledby="dia-2026-10-06"/g)).toHaveLength(1)
    expect(out.match(/<h2[^>]*>Segunda, 05\/10<\/h2>/g)).toHaveLength(1)
    expect(out.match(/<h2[^>]*>Terça, 06\/10<\/h2>/g)).toHaveLength(1)
  })

  it('agrupa por dia local e mantém a ordem cronológica recebida', () => {
    const out = render([item('a', '2026-10-05T12:00:00Z'), item('b', '2026-10-05T20:00:00Z'), item('c', '2026-10-06T13:00:00Z')])
    expect(out.indexOf('Segunda, 05/10')).toBeLessThan(out.indexOf('Terça, 06/10'))
    expect(out.indexOf('Cliente a')).toBeLessThan(out.indexOf('Cliente b'))
    expect(out.indexOf('Cliente b')).toBeLessThan(out.indexOf('Cliente c'))
  })

  it('oferece cancelar só para confirmado que ainda não terminou', () => {
    expect(render([item('a', '2026-10-05T13:30:00Z')])).toContain('Cancelar agendamento de Cliente a')
    expect(render([item('a', '2026-10-05T13:30:00Z', { status: 'cancelled' })])).not.toContain('Cancelar agendamento de')
    expect(render([item('p', '2026-09-30T13:30:00Z')])).not.toContain('Cancelar agendamento de') // já passou
  })

  it('mostra o estado real: cancelado e já aconteceu', () => {
    expect(render([item('a', '2026-10-05T13:30:00Z', { status: 'cancelled' })])).toContain('Cancelado')
    expect(render([item('p', '2026-09-30T13:30:00Z')])).toContain('Já aconteceu')
  })

  it('avisa quando um agendamento confirmado está num dia bloqueado', () => {
    const out = render([item('a', '2026-10-05T13:30:00Z')], ['2026-10-05'])
    expect(out).toContain('Dia bloqueado')
    expect(render([item('a', '2026-10-05T13:30:00Z')], ['2026-10-06'])).not.toContain('Dia bloqueado')
    expect(render([item('a', '2026-10-05T13:30:00Z', { status: 'cancelled' })], ['2026-10-05'])).not.toContain('Dia bloqueado')
    // já terminou: não dá mais para cancelar, então o aviso não faz sentido
    expect(render([item('p', '2026-09-30T13:30:00Z')], ['2026-09-30'])).not.toContain('Dia bloqueado')
  })

  it('a virada do dia usa o horário local: 23:30 de SP ainda é o dia anterior em UTC', () => {
    const out = render([item('a', '2026-10-06T02:30:00Z')]) // 23:30 do dia 05
    expect(out).toContain('Segunda, 05/10')
    expect(out).toContain('23:30')
  })
})
