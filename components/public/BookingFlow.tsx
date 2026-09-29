'use client'

import { useEffect, useRef, useState } from 'react'
import type { SlotGroup } from '@/lib/availability'
import { dayChipParts, formatLongDate } from '@/lib/dates'
import { formatDuration, formatPrice } from '@/lib/format'
import type { PublicService } from '@/lib/tenants'
import { ClockIcon } from './icons'

type Day = { day: string; open: boolean }
type SlotsState = { status: 'idle' } | { status: 'loading' } | { status: 'error' } | { status: 'ok'; groups: SlotGroup[] }

export function BookingFlow({ services, days }: { services: PublicService[]; days: Day[] }) {
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [day, setDay] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [slots, setSlots] = useState<SlotsState>({ status: 'idle' })
  const [attempt, setAttempt] = useState(0) // muda a cada "tentar novamente" para refazer a busca
  const dateRef = useRef<HTMLElement>(null)
  const timeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!serviceId || !day) return
    const controller = new AbortController()
    fetch(`/slots?service=${serviceId}&day=${day}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('slots')
        const body: unknown = await response.json()
        const groups = (body as { groups?: unknown })?.groups
        if (!Array.isArray(groups)) throw new Error('slots')
        if (!controller.signal.aborted) setSlots({ status: 'ok', groups: groups as SlotGroup[] })
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && !controller.signal.aborted) setSlots({ status: 'error' })
      })
    return () => controller.abort()
  }, [serviceId, day, attempt])

  if (services.length === 0) {
    return (
      <section aria-labelledby="servicos" className="flex flex-col px-5">
        <h2 id="servicos" className="mb-3 px-1 font-headline text-headline-sm text-ink">
          Selecione um serviço
        </h2>
        <div className="flex flex-col items-center gap-2 rounded-card bg-subtle p-6 text-center">
          <p className="font-headline text-headline-sm text-ink">Nenhum serviço disponível no momento</p>
          <p className="text-sm text-muted">Volte em breve ou fale direto com a profissional.</p>
        </div>
      </section>
    )
  }

  const service = services.find((s) => s.id === serviceId) ?? null

  const pickService = (id: string) => {
    setServiceId(id)
    setDay(null)
    setSlot(null)
    setSlots({ status: 'idle' })
    requestAnimationFrame(() => dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const pickDay = (value: string) => {
    setDay(value)
    setSlot(null)
    setSlots({ status: 'loading' })
    requestAnimationFrame(() => timeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="servicos" className="flex flex-col px-5">
        <div className="mb-3 px-1">
          <h2 id="servicos" className="font-headline text-headline-sm text-ink">
            Selecione um serviço
          </h2>
          <p className="text-label-sm text-muted">Escolha um procedimento para agendar</p>
        </div>
        <ul className="flex flex-col gap-3">
          {services.map((item) => {
            const selected = item.id === serviceId
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pickService(item.id)}
                  className={`flex min-h-12 w-full flex-col gap-2 rounded-card bg-card p-4 text-left shadow-soft transition active:scale-[0.99] ${
                    selected ? 'outline-2 outline-brand' : ''
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-headline text-headline-sm text-ink">{item.name}</span>
                    <span
                      aria-hidden
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                        selected ? 'bg-brand text-on-brand' : 'bg-subtle text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </span>
                  <span className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-label-sm text-muted">
                      <ClockIcon />
                      {formatDuration(item.duration_minutes)}
                    </span>
                    <span className="font-headline text-headline-sm text-brand">{formatPrice(item.price_cents)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {service && (
        <section ref={dateRef} aria-labelledby="datas" className="flex scroll-mt-4 flex-col">
          <div className="mb-3 px-6">
            <h2 id="datas" className="font-headline text-headline-md text-ink">
              Para quando você gostaria de agendar?
            </h2>
            <p className="text-sm text-muted">Datas até 30 dias à frente. Horário de Brasília.</p>
          </div>
          <ul className="flex snap-x gap-3 overflow-x-auto px-5 py-2 [scrollbar-width:none]">
            {days.map(({ day: value, open }) => {
              const parts = dayChipParts(value)
              const selected = value === day
              const base = 'flex h-[106px] w-[74px] shrink-0 snap-start flex-col items-center justify-center rounded-panel p-2'
              return (
                <li key={value}>
                  {open ? (
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={formatLongDate(value)}
                      onClick={() => pickDay(value)}
                      className={`${base} shadow-soft transition active:scale-95 ${selected ? 'bg-brand text-on-brand' : 'bg-card text-ink'}`}
                    >
                      <span className={`text-label-sm uppercase ${selected ? 'text-on-brand/80' : 'text-muted'}`}>{parts.weekday}</span>
                      <span className="my-0.5 font-headline text-headline-md">{parts.dayNumber}</span>
                      <span className={`text-label-sm ${selected ? 'text-on-brand/90' : 'text-muted'}`}>{parts.month}</span>
                    </button>
                  ) : (
                    <div aria-label={`${formatLongDate(value)}: fechado`} className={`${base} bg-subtle opacity-45`}>
                      <span className="text-label-sm uppercase text-muted">{parts.weekday}</span>
                      <span className="my-0.5 font-headline text-headline-md text-muted">{parts.dayNumber}</span>
                      <span className="rounded-full bg-container px-1.5 py-0.5 text-[10px] font-medium text-muted">Fechado</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {service && day && (
        <section ref={timeRef} aria-labelledby="horarios" aria-live="polite" className="flex scroll-mt-4 flex-col gap-4 px-5">
          <div className="px-1">
            <h2 id="horarios" className="font-headline text-headline-md text-ink">
              Escolha o melhor horário
            </h2>
            <p className="text-sm text-muted">{formatLongDate(day)}</p>
          </div>

          {slots.status === 'loading' && <p className="rounded-card bg-subtle p-6 text-center text-muted">Buscando horários…</p>}
          {slots.status === 'error' && (
            <div role="alert" className="flex flex-col items-center gap-3 rounded-card bg-danger-tint p-6 text-center text-danger">
              <p>Não foi possível carregar os horários.</p>
              <button
                type="button"
                onClick={() => {
                  setSlots({ status: 'loading' })
                  setAttempt((n) => n + 1)
                }}
                className="h-12 rounded-full border-[1.5px] border-danger px-6 text-label-md"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {slots.status === 'ok' && slots.groups.length === 0 && (
            <div className="flex flex-col items-center gap-1 rounded-card bg-subtle p-6 text-center">
              <p className="font-headline text-headline-sm text-ink">Nenhum horário disponível neste dia</p>
              <p className="text-sm text-muted">Escolha outra data acima.</p>
            </div>
          )}
          {slots.status === 'ok' &&
            slots.groups.map((group) => (
              <div key={group.period}>
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="font-headline text-headline-sm text-ink">{group.period}</h3>
                  <span className="rounded-full bg-subtle px-2.5 py-0.5 text-label-sm text-muted">
                    {group.slots.length} {group.slots.length === 1 ? 'livre' : 'livres'}
                  </span>
                </div>
                <ul className="grid grid-cols-2 gap-3">
                  {group.slots.map((time) => {
                    const selected = time === slot
                    return (
                      <li key={time}>
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setSlot(time)}
                          className={`flex h-14 w-full items-center justify-between rounded-card px-4 font-headline text-headline-sm shadow-soft transition active:scale-95 ${
                            selected ? 'bg-brand text-on-brand' : 'bg-card text-ink'
                          }`}
                        >
                          {time}
                          {selected && <span aria-hidden>✓</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
        </section>
      )}
    </div>
  )
}
