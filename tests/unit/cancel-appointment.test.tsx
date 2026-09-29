// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CancelAppointment } from '@/components/public/CancelAppointment'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  refresh.mockReset()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const open = async () => {
  render(<CancelAppointment token="tok-1" />)
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar agendamento' }))
}

describe('CancelAppointment', () => {
  it('pede confirmação antes de cancelar e permite manter o horário', async () => {
    await open()
    expect(screen.getByText('Deseja mesmo cancelar?')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Manter meu horário' }))
    expect(screen.queryByText('Deseja mesmo cancelar?')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('confirma: chama o cancelamento do token e atualiza a página', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: 'cancelled' }), { status: 200 }))
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))
    expect(fetchMock).toHaveBeenCalledWith('/agendamento/tok-1/cancel', { method: 'POST' })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('erro mostra mensagem e deixa tentar de novo', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(refresh).not.toHaveBeenCalled()
    expect((screen.getByRole('button', { name: 'Sim, cancelar agendamento' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('o horário que já passou (409) atualiza a página para mostrar o status real', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'already_happened' }), { status: 409 }))
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('depois de cancelar, o painel de confirmação não reaparece enquanto a página atualiza', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: 'cancelled' }), { status: 200 }))
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Deseja mesmo cancelar?')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar agendamento' })).toBeNull()
  })

  it('link que deixou de valer (404) atualiza a página em vez de repetir o erro', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 404 }))
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('clique duplo envia uma vez só', async () => {
    let release: (r: Response) => void = () => {}
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (release = resolve)))
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelando…' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    release(new Response('{}', { status: 200 }))
  })
})
