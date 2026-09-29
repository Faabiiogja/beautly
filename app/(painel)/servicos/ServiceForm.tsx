'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/auth/FormMessage'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { TextField } from '@/components/auth/TextField'
import { createService, updateService, type ServiceFormState } from './actions'

type Defaults = { id?: string; name: string; price: string; duration: string }

export function ServiceForm({ mode, defaults }: { mode: 'create' | 'edit'; defaults?: Defaults }) {
  const [state, action] = useActionState<ServiceFormState, FormData>(mode === 'create' ? createService : updateService, {})
  const v = state.values ?? defaults ?? { name: '', price: '', duration: '' }
  return (
    <form key={state.savedAt} action={action} noValidate className="flex flex-col gap-4">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      {state.savedAt && mode === 'edit' && <FormMessage tone="info">Serviço atualizado.</FormMessage>}
      <TextField label="Nome do serviço" name="name" defaultValue={v.name} error={state.fieldErrors?.name} placeholder="Manicure" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Preço (R$)" name="price" inputMode="decimal" defaultValue={v.price} error={state.fieldErrors?.price} placeholder="85,00" />
        <TextField label="Duração (minutos)" name="duration" inputMode="numeric" defaultValue={v.duration} error={state.fieldErrors?.duration} placeholder="60" hint="Inclua o tempo de troca entre clientes." />
      </div>
      <SubmitButton>{mode === 'create' ? 'Adicionar serviço' : 'Salvar alterações'}</SubmitButton>
    </form>
  )
}
