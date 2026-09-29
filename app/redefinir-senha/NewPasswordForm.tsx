'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/auth/FormMessage'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { TextField } from '@/components/auth/TextField'
import { updatePassword, type NewPasswordState } from './actions'

export function NewPasswordForm() {
  const [state, action] = useActionState<NewPasswordState, FormData>(updatePassword, {})
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <TextField label="Nova senha" name="password" type="password" autoComplete="new-password" error={state.fieldErrors?.password} />
      <TextField label="Confirme a nova senha" name="confirm" type="password" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <SubmitButton>Salvar nova senha</SubmitButton>
    </form>
  )
}
