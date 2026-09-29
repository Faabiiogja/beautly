'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

export function CancelAppointment({ token }: { token: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false) // depois de cancelar, não reaparece o painel enquanto a página atualiza
  const inFlight = useRef(false)

  async function cancel() {
    if (inFlight.current) return
    inFlight.current = true
    setSending(true)
    setError(null)
    try {
      const response = await fetch(`/agendamento/${token}/cancel`, { method: 'POST' })
      if (response.ok) {
        setDone(true)
        return router.refresh() // a página volta já com o status "Cancelado"
      }
      if (response.status === 409 || response.status === 404) {
        // o horário passou (409) ou o link deixou de valer (404) com a página aberta: mostra o estado real
        setDone(true)
        return router.refresh()
      }
      setError('Não foi possível cancelar. Tente novamente.')
    } catch {
      setError('Não foi possível cancelar. Verifique sua conexão e tente novamente.')
    } finally {
      inFlight.current = false
      setSending(false)
    }
  }

  if (done) return null

  if (!confirming) {
    return (
      <section className="flex flex-col gap-2 text-center">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="h-12 w-full rounded-full border-[1.5px] border-border-soft bg-card text-label-md text-ink transition active:scale-[0.98]"
        >
          Cancelar agendamento
        </button>
      </section>
    )
  }

  return (
    <section aria-labelledby="cancelar" className="flex flex-col gap-3 rounded-card bg-danger-tint p-4">
      <h2 id="cancelar" className="font-headline text-headline-sm text-danger">
        Deseja mesmo cancelar?
      </h2>
      <p className="text-sm text-ink">Seu horário será liberado para outra pessoa. Você pode marcar um novo quando quiser.</p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={cancel}
        disabled={sending}
        className="h-12 w-full rounded-full border-[1.5px] border-danger bg-card text-label-md text-danger transition active:scale-[0.98] disabled:opacity-60"
      >
        {sending ? 'Cancelando…' : 'Sim, cancelar agendamento'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={sending}
        className="h-12 w-full rounded-full bg-card text-label-md text-ink transition active:scale-[0.98] disabled:opacity-60"
      >
        Manter meu horário
      </button>
    </section>
  )
}
