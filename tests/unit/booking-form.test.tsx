// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BookingForm } from '@/components/public/BookingForm'

const service = { id: '11111111-2222-3333-4444-555555555555', name: 'Manicure', price_cents: 5000, duration_minutes: 60 }
let fetchMock: ReturnType<typeof vi.fn>
const onCreated = vi.fn()
const onSlotTaken = vi.fn()

const setup = () => render(<BookingForm service={service} day="2026-10-05" time="10:30" onCreated={onCreated} onSlotTaken={onSlotTaken} />)
const fill = async (name: string, phone: string) => {
  if (name) await userEvent.type(screen.getByLabelText('Seu nome completo'), name)
  if (phone) await userEvent.type(screen.getByLabelText('Seu WhatsApp / telefone'), phone)
}

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  onCreated.mockReset()
  onSlotTaken.mockReset()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('BookingForm', () => {
  it('resume o que foi escolhido', () => {
    setup()
    expect(screen.getByText('Manicure')).toBeTruthy()
    expect(screen.getByText(/às 10:30/)).toBeTruthy()
  })

  it('aplica a máscara enquanto digita o telefone', async () => {
    setup()
    await fill('', '11999990000')
    expect((screen.getByLabelText('Seu WhatsApp / telefone') as HTMLInputElement).value).toBe('(11) 99999-0000')
  })

  it('bloqueia a confirmação com telefone inválido, sem chamar o servidor', async () => {
    setup()
    await fill('Maria', '1199')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
    expect(screen.getByText(/telefone válido com DDD/)).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('exige o nome', async () => {
    setup()
    await fill('', '11999990000')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
    expect(screen.getByText('Informe seu nome.')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envia os dados e, no 201, entrega o token do link', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ token: 'tok-123' }), { status: 201 }))
    setup()
    await fill('  Maria da Silva ', '11999990000')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/appointments')
    expect(JSON.parse(init.body)).toEqual({ serviceId: service.id, day: '2026-10-05', time: '10:30', name: '  Maria da Silva ', phone: '(11) 99999-0000' })
    expect(onCreated).toHaveBeenCalledWith('tok-123')
  })

  it('no 409 avisa que o horário foi tomado e volta para a escolha de horário', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'slot_taken' }), { status: 409 }))
    setup()
    await fill('Maria', '11999990000')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
    expect(onSlotTaken).toHaveBeenCalledTimes(1)
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('erro do servidor mostra mensagem clara e libera o botão para tentar de novo', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    setup()
    await fill('Maria', '11999990000')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Confirmar agendamento' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('serviço que saiu do ar (404) mostra uma mensagem que leva a recarregar', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 404 }))
    setup()
    await fill('Maria', '11999990000')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
    expect(await screen.findByText(/serviço não está mais disponível/)).toBeTruthy()
    expect(onSlotTaken).not.toHaveBeenCalled()
  })

  it('teto de 3 agendamentos (429) explica o motivo e como resolver, sem voltar para a escolha de horário', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'limit_reached' }), { status: 429 }))
    setup()
    await fill('Maria', '11999990000')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
    expect(await screen.findByText(/já tem 3 agendamentos futuros/)).toBeTruthy()
    expect(onSlotTaken).not.toHaveBeenCalled()
    expect((screen.getByRole('button', { name: 'Confirmar agendamento' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('não envia duas vezes com clique duplo', async () => {
    let release: (r: Response) => void = () => {}
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (release = resolve)))
    setup()
    await fill('Maria', '11999990000')
    const button = screen.getByRole('button', { name: 'Confirmar agendamento' })
    await userEvent.click(button)
    await userEvent.click(screen.getByRole('button', { name: 'Confirmando…' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    release(new Response(JSON.stringify({ token: 't' }), { status: 201 }))
  })
})
