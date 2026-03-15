'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Slot {
  utc: string // 'YYYY-MM-DDTHH:mm:ss.sssZ'
  label: string // 'HH:mm' no timezone do tenant
}

interface AvailabilityPickerProps {
  serviceId: string
  professionalId: string
  timezone: string
  primary: string
  backPath: string
}

function formatSlotLabel(utc: string, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utc))
}

function formatDateLabel(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function getDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function getDayNumber(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    day: 'numeric',
  }).format(date)
}

function getDayName(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    weekday: 'short',
  })
    .format(date)
    .replace('.', '')
}

export function AvailabilityPicker({
  serviceId,
  professionalId,
  timezone,
  primary,
  backPath,
}: AvailabilityPickerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Gera os proximos 30 dias como opcoes de data
  const today = new Date()
  const dates: Date[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  async function handleDateSelect(date: Date) {
    setSelectedDate(date)
    setSlots([])
    setSelectedSlot(null)
    setError(null)
    setLoadingSlots(true)

    const dateStr = getDateKey(date, timezone)

    try {
      const res = await fetch(
        `/api/availability?professionalId=${professionalId}&serviceId=${serviceId}&date=${dateStr}`
      )
      if (!res.ok) {
        setError('Erro ao carregar horários. Tente novamente.')
        return
      }
      const json = await res.json()
      const fetched: Slot[] = (json.slots ?? []).map((utc: string) => ({
        utc,
        label: formatSlotLabel(utc, timezone),
      }))
      setSlots(fetched)
    } catch {
      setError('Erro ao carregar horários. Tente novamente.')
    } finally {
      setLoadingSlots(false)
    }
  }

  function handleSlotSelect(slot: Slot) {
    setSelectedSlot(slot)
    startTransition(() => {
      router.push(
        `/book/confirm?serviceId=${serviceId}&professionalId=${professionalId}&slot=${encodeURIComponent(slot.utc)}&backUrl=${encodeURIComponent(backPath)}`
      )
    })
  }

  const selectedDateKey = selectedDate ? getDateKey(selectedDate, timezone) : null

  // Agrupar slots por periodo do dia
  const morningSlots = slots.filter((s) => {
    const hour = parseInt(s.label.split(':')[0], 10)
    return hour < 12
  })
  const afternoonSlots = slots.filter((s) => {
    const hour = parseInt(s.label.split(':')[0], 10)
    return hour >= 12 && hour < 18
  })
  const eveningSlots = slots.filter((s) => {
    const hour = parseInt(s.label.split(':')[0], 10)
    return hour >= 18
  })

  return (
    <div className="space-y-6">
      {/* Selecao de data — scroll horizontal */}
      <div>
        <p className="mb-3 text-sm font-semibold text-stone-500 uppercase tracking-[0.16em] text-[11px]">
          Escolha uma data
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => {
            const key = getDateKey(date, timezone)
            const isSelected = key === selectedDateKey
            return (
              <button
                key={key}
                onClick={() => handleDateSelect(date)}
                className="flex min-w-[56px] flex-col items-center rounded-2xl border px-3 py-3 text-center transition-colors"
                style={
                  isSelected
                    ? { backgroundColor: primary, borderColor: primary, color: '#fff' }
                    : undefined
                }
              >
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${isSelected ? '' : 'text-stone-400'}`}
                >
                  {getDayName(date, timezone)}
                </span>
                <span
                  className={`mt-1 text-base font-semibold leading-none ${isSelected ? '' : 'text-stone-900'}`}
                >
                  {getDayNumber(date, timezone)}
                </span>
              </button>
            )
          })}
        </div>
        {/* Label da data selecionada */}
        {selectedDate && (
          <p className="mt-3 text-sm font-medium capitalize text-stone-600">
            {formatDateLabel(selectedDate, timezone)}
          </p>
        )}
      </div>

      {/* Slots de horario */}
      {selectedDate && (
        <div>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200" style={{ borderTopColor: primary }} />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-dashed border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-sm text-stone-500">
              Nenhum horário disponível para este dia.
            </div>
          ) : (
            <div className="space-y-5">
              {[
                { label: 'Manhã', items: morningSlots },
                { label: 'Tarde', items: afternoonSlots },
                { label: 'Noite', items: eveningSlots },
              ]
                .filter((g) => g.items.length > 0)
                .map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {group.items.map((slot) => {
                        const isSelected = selectedSlot?.utc === slot.utc
                        return (
                          <button
                            key={slot.utc}
                            onClick={() => handleSlotSelect(slot)}
                            disabled={isPending}
                            className="rounded-2xl border bg-white px-3 py-3 text-sm font-semibold transition-colors hover:border-stone-300 disabled:opacity-50"
                            style={
                              isSelected
                                ? { borderColor: primary, color: primary }
                                : undefined
                            }
                          >
                            {slot.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-white px-6 py-10 text-center text-sm text-stone-400">
          Selecione uma data para ver os horários disponíveis.
        </div>
      )}
    </div>
  )
}
