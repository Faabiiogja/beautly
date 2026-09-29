import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { CancelButton } from '@/app/(painel)/agendamentos/CancelButton'
import { formatPrice } from '@/lib/format'

vi.mock('@/app/(painel)/agendamentos/actions', () => ({ cancelAppointment: () => {} }))

const html = renderToStaticMarkup(
  <CancelButton
    id="abc-123"
    clientName="Maria"
    serviceName="Corte + escova"
    priceCents={150000}
    whenLabel="Hoje às 14:30"
    phone="(11) 99999-0000"
  />,
)

describe('CancelButton (painel)', () => {
  it('a confirmação já vem no HTML do servidor (funciona sem JavaScript)', () => {
    expect(html).toContain('<details')
    expect(html).toContain('Confirmar cancelamento')
    expect(html).toContain('Cancelar o agendamento de Maria?')
  })

  it('o botão que abre é identificado pelo nome da cliente', () => {
    expect(html).toContain('aria-label="Cancelar agendamento de Maria"')
  })

  it('o formulário leva o id do agendamento', () => {
    expect(html).toMatch(/<input type="hidden" name="id" value="abc-123"/)
  })

  it('mostra o resumo do agendamento com o preço formatado (mesma formatação de lib/format, com separador de milhar)', () => {
    expect(html).toContain('Corte + escova')
    expect(html).toContain(formatPrice(150000))
    expect(formatPrice(150000)).toContain('1.500,00') // confere o separador de milhar de verdade
    expect(html).toContain('Hoje às 14:30 · (11) 99999-0000')
  })
})
