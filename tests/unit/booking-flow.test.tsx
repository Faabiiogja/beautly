// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BookingFlow } from '@/components/public/BookingFlow'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const S1 = '11111111-1111-1111-1111-111111111111'
const S2 = '22222222-2222-2222-2222-222222222222'
const services = [
  { id: S1, name: 'Manicure', price_cents: 5000, duration_minutes: 60 },
  { id: S2, name: 'Pedicure', price_cents: 6500, duration_minutes: 90 },
]
const days = [
  { day: '2026-09-29', open: true },
  { day: '2026-09-30', open: true },
  { day: '2026-10-04', open: false }, // domingo
]

const groups = [
  { period: 'Manhã', slots: ['09:00', '11:00'] },
  { period: 'Tarde', slots: ['14:00'] },
]

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  fetchMock = vi.fn(async (url: string) => {
    if (url.includes('day=2026-09-30')) return new Response(JSON.stringify({ groups: [] }), { status: 200 })
    return new Response(JSON.stringify({ groups }), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('BookingFlow', () => {
  it('só mostra as datas depois de escolher um serviço', async () => {
    render(<BookingFlow services={services} days={days} />)
    expect(screen.queryByText('Para quando você gostaria de agendar?')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /Manicure/ }))
    expect(screen.getByText('Para quando você gostaria de agendar?')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Manicure/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /Pedicure/ }).getAttribute('aria-pressed')).toBe('false')
  })

  it('dias fechados não são clicáveis e aparecem como Fechado', async () => {
    render(<BookingFlow services={services} days={days} />)
    await userEvent.click(screen.getByRole('button', { name: /Manicure/ }))
    expect(screen.getByText('Fechado')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /04\/10\/2026/ })).toBeNull()
  })

  it('busca os horários do serviço e da data escolhidos e os agrupa por período', async () => {
    render(<BookingFlow services={services} days={days} />)
    await userEvent.click(screen.getByRole('button', { name: /Manicure/ }))
    await userEvent.click(screen.getByRole('button', { name: /29\/09\/2026/ }))

    expect(fetchMock).toHaveBeenCalledWith(`/slots?service=${S1}&day=2026-09-29`, expect.anything())
    const morning = await screen.findByRole('heading', { name: 'Manhã' })
    expect(morning).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Tarde' })).toBeTruthy()
    expect(screen.getByText('2 livres')).toBeTruthy()
    expect(screen.getByText('1 livre')).toBeTruthy()
    expect(screen.getByRole('button', { name: '09:00' })).toBeTruthy()
  })

  it('seleciona um horário (só um por vez)', async () => {
    render(<BookingFlow services={services} days={days} />)
    await userEvent.click(screen.getByRole('button', { name: /Manicure/ }))
    await userEvent.click(screen.getByRole('button', { name: /29\/09\/2026/ }))
    await screen.findByRole('button', { name: '09:00' })

    await userEvent.click(screen.getByRole('button', { name: '09:00' }))
    expect(screen.getByRole('button', { name: /09:00/ }).getAttribute('aria-pressed')).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: '14:00' }))
    expect(screen.getByRole('button', { name: /14:00/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '09:00' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('mostra estado vazio quando o dia não tem horário', async () => {
    render(<BookingFlow services={services} days={days} />)
    await userEvent.click(screen.getByRole('button', { name: /Manicure/ }))
    await userEvent.click(screen.getByRole('button', { name: /30\/09\/2026/ }))
    expect(await screen.findByText('Nenhum horário disponível neste dia')).toBeTruthy()
  })

  it('mostra erro claro quando a busca falha', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    render(<BookingFlow services={services} days={days} />)
    await userEvent.click(screen.getByRole('button', { name: /Manicure/ }))
    await userEvent.click(screen.getByRole('button', { name: /29\/09\/2026/ }))
    expect(await screen.findByRole('alert')).toBeTruthy()
  })

  it('o botão de tentar novamente refaz a busca', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    render(<BookingFlow services={services} days={days} />)
    await userEvent.click(screen.getByRole('button', { name: /Manicure/ }))
    await userEvent.click(screen.getByRole('button', { name: /29\/09\/2026/ }))
    await screen.findByRole('alert')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('button', { name: '09:00' })).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('escolher um horário abre o formulário de dados; trocar de horário mantém um só formulário', async () => {
    render(<BookingFlow services={services} days={days} />)
    await userEvent.click(screen.getByRole('button', { name: /Manicure/ }))
    await userEvent.click(screen.getByRole('button', { name: /29\/09\/2026/ }))
    await screen.findByRole('button', { name: '09:00' })
    expect(screen.queryByLabelText('Seu nome completo')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: '09:00' }))
    expect(screen.getByLabelText('Seu nome completo')).toBeTruthy()
    expect(screen.getByText(/às 09:00/)).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: '14:00' }))
    expect(screen.getAllByLabelText('Seu nome completo')).toHaveLength(1)
    expect(screen.getByText(/às 14:00/)).toBeTruthy()
  })

  it('horário tomado por outra cliente: avisa, limpa a escolha e recarrega os horários', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return new Response(JSON.stringify({ error: 'slot_taken' }), { status: 409 })
      return new Response(JSON.stringify({ groups }), { status: 200 })
    })
    render(<BookingFlow services={services} days={days} />)
    await userEvent.click(screen.getByRole('button', { name: /Manicure/ }))
    await userEvent.click(screen.getByRole('button', { name: /29\/09\/2026/ }))
    await userEvent.click(await screen.findByRole('button', { name: '09:00' }))
    await userEvent.type(screen.getByLabelText('Seu nome completo'), 'Maria')
    await userEvent.type(screen.getByLabelText('Seu WhatsApp / telefone'), '11999990000')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))

    expect(await screen.findByText(/não está mais disponível/)).toBeTruthy()
    expect(screen.queryByLabelText('Seu nome completo')).toBeNull()
    const slotFetches = fetchMock.mock.calls.filter(([, init]) => init?.method !== 'POST')
    expect(slotFetches.length).toBeGreaterThanOrEqual(2) // busca inicial + recarga
  })

  it('trocar de serviço limpa data, horários e seleção', async () => {
    render(<BookingFlow services={services} days={days} />)
    await userEvent.click(screen.getByRole('button', { name: /Manicure/ }))
    await userEvent.click(screen.getByRole('button', { name: /29\/09\/2026/ }))
    await screen.findByRole('button', { name: '09:00' })

    await userEvent.click(screen.getByRole('button', { name: /Pedicure/ }))
    expect(screen.queryByRole('heading', { name: 'Escolha o melhor horário' })).toBeNull()
    expect(screen.getByRole('button', { name: /29\/09\/2026/ }).getAttribute('aria-pressed')).toBe('false')
  })

  it('sem serviços mostra o estado vazio', () => {
    render(<BookingFlow services={[]} days={days} />)
    expect(screen.getByText('Nenhum serviço disponível no momento')).toBeTruthy()
    expect(within(document.body).queryByText('Fechado')).toBeNull()
  })
})
