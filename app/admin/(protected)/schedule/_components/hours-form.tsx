'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { upsertBusinessHour } from '../actions'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface BusinessHour {
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_open: boolean
}

export function HoursForm({ hours }: { hours: BusinessHour[] }) {
  const defaultHours: BusinessHour[] = Array.from({ length: 7 }, (_, i) => {
    const existing = hours.find((h) => h.day_of_week === i)
    return existing ?? { day_of_week: i, open_time: '09:00', close_time: '18:00', is_open: false }
  })

  const [rows, setRows] = useState(defaultHours)
  const [isPending, startTransition] = useTransition()

  function update(index: number, patch: Partial<BusinessHour>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  async function handleSave() {
    startTransition(async () => {
      const results = await Promise.all(rows.map((row) => upsertBusinessHour(row)))
      const hasError = results.some((r) => !r.success)
      if (hasError) {
        toast.error('Erro ao salvar horários')
      } else {
        toast.success('Horários salvos')
      }
    })
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3">
          <span className="w-8 text-sm font-medium text-stone-700">{DAY_LABELS[i]}</span>
          <input
            type="time"
            value={row.open_time ?? '09:00'}
            disabled={!row.is_open}
            onChange={(e) => update(i, { open_time: e.target.value })}
            className="rounded-lg border border-stone-200 px-2 py-1 text-sm disabled:opacity-40"
          />
          <span className="text-stone-400 text-sm">–</span>
          <input
            type="time"
            value={row.close_time ?? '18:00'}
            disabled={!row.is_open}
            onChange={(e) => update(i, { close_time: e.target.value })}
            className="rounded-lg border border-stone-200 px-2 py-1 text-sm disabled:opacity-40"
          />
          <label className="flex items-center gap-1.5 text-sm text-stone-500 ml-auto">
            <input
              type="checkbox"
              checked={!row.is_open}
              onChange={(e) => update(i, { is_open: !e.target.checked })}
              className="accent-pink-500"
            />
            Fechado
          </label>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="mt-2 rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-600 disabled:opacity-60"
      >
        {isPending ? 'Salvando…' : 'Salvar horários'}
      </button>
    </div>
  )
}
