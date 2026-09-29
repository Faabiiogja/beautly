'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { FormMessage } from '@/components/auth/FormMessage'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { TextField } from '@/components/auth/TextField'
import { signIn, type LoginState } from './actions'

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action] = useActionState<LoginState, FormData>(signIn, {})
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {notice && <FormMessage tone="info">{notice}</FormMessage>}
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <TextField label="E-mail" name="email" type="email" autoComplete="email" defaultValue={state.email} error={state.fieldErrors?.email} />
      <TextField label="Senha" name="password" type="password" autoComplete="current-password" error={state.fieldErrors?.password} />
      <SubmitButton>Entrar</SubmitButton>
      <Link href="/esqueci-senha" className="text-center text-label-md text-primary">
        Esqueci minha senha
      </Link>
    </form>
  )
}
