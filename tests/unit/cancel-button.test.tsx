import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { CancelButton } from '@/app/(painel)/agendamentos/CancelButton'

vi.mock('@/app/(painel)/agendamentos/actions', () => ({ cancelAppointment: () => {} }))

describe('CancelButton (painel)', () => {
  const html = renderToStaticMarkup(<CancelButton id="abc-123" clientName="Maria" />)

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
})
