'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/auth/FormMessage'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { addBlockedDay, type BlockedDayState } from './actions'

export function BlockedDayForm({ min }: { min: string }) {
  const [state, action] = useActionState<BlockedDayState, FormData>(addBlockedDay, {})
  return (
    <form key={state.savedAt} action={action} noValidate className="flex flex-col gap-4">
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="day" className="text-label-md text-ink">
          Dia a bloquear
        </label>
        <input
          id="day"
          name="day"
          type="date"
          min={min}
          className="h-[52px] rounded-card border-[1.5px] border-border-soft bg-card px-4 text-ink outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15"
        />
      </div>
      <SubmitButton>Bloquear dia</SubmitButton>
    </form>
  )
}
