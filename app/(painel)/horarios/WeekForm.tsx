'use client'

import { useActionState, useState } from 'react'
import { FormMessage } from '@/components/auth/FormMessage'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { DISPLAY_ORDER, WEEKDAY_NAMES, type DayInput } from '@/lib/hours'
import { saveWorkingHours, type WeekFormState } from './actions'

function DayRow({ weekday, initial, error }: { weekday: number; initial: DayInput; error?: string }) {
  const [closed, setClosed] = useState(initial.closed)
  const timeClass =
    'h-12 rounded-card border-[1.5px] border-border-soft bg-card px-3 text-ink outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 disabled:bg-subtle disabled:text-muted'
  return (
    <li className="flex flex-col gap-2 rounded-card bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-4">
        <span className="w-24 font-headline text-headline-sm text-ink">{WEEKDAY_NAMES[weekday]}</span>
        <label className="flex h-11 items-center gap-2 text-label-md text-ink">
          <input type="checkbox" name={`closed_${weekday}`} checked={closed} onChange={(e) => setClosed(e.target.checked)} className="h-5 w-5 accent-brand" />
          Fechado
        </label>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`start_${weekday}`}>
            {WEEKDAY_NAMES[weekday]}: início
          </label>
          <input id={`start_${weekday}`} type="time" name={`start_${weekday}`} defaultValue={initial.start} disabled={closed} className={timeClass} />
          <span className="text-muted">às</span>
          <label className="sr-only" htmlFor={`end_${weekday}`}>
            {WEEKDAY_NAMES[weekday]}: fim
          </label>
          <input id={`end_${weekday}`} type="time" name={`end_${weekday}`} defaultValue={initial.end} disabled={closed} className={timeClass} />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  )
}

export function WeekForm({ initial }: { initial: DayInput[] }) {
  const [state, action] = useActionState<WeekFormState, FormData>(saveWorkingHours, {})
  const days = state.values ?? initial
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      {state.savedAt && <FormMessage tone="info">Expediente salvo.</FormMessage>}
      <ul className="flex flex-col gap-3">
        {DISPLAY_ORDER.map((weekday) => (
          <DayRow key={`${weekday}-${state.savedAt ?? 0}`} weekday={weekday} initial={days[weekday]} error={state.errors?.[weekday]} />
        ))}
      </ul>
      <SubmitButton>Salvar expediente</SubmitButton>
    </form>
  )
}
