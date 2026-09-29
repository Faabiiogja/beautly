'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { FormMessage } from '@/components/auth/FormMessage'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { TextField } from '@/components/auth/TextField'
import { requestPasswordReset, type ResetRequestState } from './actions'

export function ResetRequestForm({ invalidLink }: { invalidLink: boolean }) {
  const [state, action] = useActionState<ResetRequestState, FormData>(requestPasswordReset, {})
  if (state.sent) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tone="info">Se este e-mail estiver cadastrado, enviamos um link para criar uma nova senha.</FormMessage>
        <Link href="/login" className="text-center text-label-md text-primary">
          Voltar ao login
        </Link>
      </div>
    )
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {invalidLink && <FormMessage tone="error">Esse link expirou ou já foi usado. Peça um novo.</FormMessage>}
      <TextField label="E-mail" name="email" type="email" autoComplete="email" error={state.error} />
      <SubmitButton>Enviar link</SubmitButton>
      <Link href="/login" className="text-center text-label-md text-primary">
        Voltar ao login
      </Link>
    </form>
  )
}
