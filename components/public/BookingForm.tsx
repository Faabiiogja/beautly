'use client'

import { useRef, useState } from 'react'
import { validateBooking, type BookingErrors } from '@/lib/booking-validation'
import { formatLongDate } from '@/lib/dates'
import { formatDuration, formatPrice } from '@/lib/format'
import { maskPhone } from '@/lib/phone'
import type { PublicService } from '@/lib/tenants'

type Props = {
  service: PublicService
  day: string
  time: string
  onCreated: (token: string) => void
  // o horário foi tomado por outra cliente: volta para a escolha de horário
  onSlotTaken: () => void
}

const inputClass = (error?: string) =>
  `h-[52px] rounded-card border-[1.5px] bg-card px-4 text-base text-ink outline-none transition focus:border-brand focus:ring-[3px] focus:ring-brand/15 ${
    error ? 'border-danger' : 'border-border-soft'
  }`

export function BookingForm({ service, day, time, onCreated, onSlotTaken }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<BookingErrors>({})
  const [sending, setSending] = useState(false)
  const inFlight = useRef(false) // trava síncrona: dois envios no mesmo tick passariam pelo estado

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (inFlight.current) return
    const parsed = validateBooking({ serviceId: service.id, day, time, name, phone })
    if (!parsed.ok) return setErrors(parsed.errors)

    setErrors({})
    inFlight.current = true
    setSending(true)
    try {
      const response = await fetch('/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: service.id, day, time, name, phone }),
      })
      if (response.status === 201) {
        const body: { token?: string } = await response.json()
        if (body.token) return onCreated(body.token)
      }
      if (response.status === 409) return onSlotTaken()
      if (response.status === 404) return setErrors({ form: 'Este serviço não está mais disponível. Recarregue a página e escolha novamente.' })
      if (response.status === 400) {
        const body: { errors?: BookingErrors } = await response.json()
        return setErrors(body.errors ?? { form: 'Confira os dados e tente novamente.' })
      }
      setErrors({ form: 'Não foi possível confirmar o agendamento. Tente novamente.' })
    } catch {
      setErrors({ form: 'Não foi possível confirmar o agendamento. Verifique sua conexão e tente novamente.' })
    } finally {
      inFlight.current = false
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-labelledby="dados" className="flex flex-col gap-5">
      <div className="px-1">
        <h2 id="dados" className="font-headline text-headline-md text-ink">
          Quase pronto! Quem vai ser atendida?
        </h2>
        <p className="text-sm text-muted">Precisamos só do seu nome e telefone para confirmar o horário. Sem cadastro nem senha.</p>
      </div>

      <dl className="flex flex-col gap-1 rounded-card bg-container-low p-4 text-sm">
        <dt className="sr-only">Serviço</dt>
        <dd className="font-headline text-headline-sm text-ink">{service.name}</dd>
        <dt className="sr-only">Data e horário</dt>
        <dd className="text-muted">
          {formatLongDate(day)} às {time}
        </dd>
        <dt className="sr-only">Duração e valor</dt>
        <dd className="text-muted">
          {formatDuration(service.duration_minutes)} · <span className="text-brand">{formatPrice(service.price_cents)}</span>
        </dd>
      </dl>

      {errors.form && (
        <p role="alert" className="rounded-card bg-danger-tint px-4 py-3 text-sm text-danger">
          {errors.form}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="client_name" className="text-label-md text-ink">
          Seu nome completo
        </label>
        <input
          id="client_name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'client_name-error' : undefined}
          className={inputClass(errors.name)}
        />
        {errors.name && (
          <p id="client_name-error" className="text-sm text-danger">
            {errors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="client_phone" className="text-label-md text-ink">
          Seu WhatsApp / telefone
        </label>
        <input
          id="client_phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          value={phone}
          onChange={(e) => setPhone(maskPhone(e.target.value))}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? 'client_phone-error' : undefined}
          className={inputClass(errors.phone)}
        />
        {errors.phone && (
          <p id="client_phone-error" className="text-sm text-danger">
            {errors.phone}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={sending}
        className="h-14 w-full rounded-full bg-brand text-label-lg text-on-brand shadow-soft transition active:scale-[0.98] disabled:opacity-60"
      >
        {sending ? 'Confirmando…' : 'Confirmar agendamento'}
      </button>
    </form>
  )
}
