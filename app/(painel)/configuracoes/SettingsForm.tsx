'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/auth/FormMessage'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { TextField } from '@/components/auth/TextField'
import { saveSettings, type SettingsFormState } from './actions'

type Defaults = { business_name: string; phone: string; address: string; description: string; logo_url: string | null }

export function SettingsForm({ defaults }: { defaults: Defaults }) {
  const [state, action] = useActionState<SettingsFormState, FormData>(saveSettings, {})
  const v = state.values ?? defaults
  return (
    <form key={state.savedAt} action={action} noValidate className="flex flex-col gap-5">
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      {state.savedAt && <FormMessage tone="info">Configurações salvas. Sua página pública já mostra as mudanças.</FormMessage>}

      <TextField label="Nome do negócio" name="business_name" defaultValue={v.business_name} error={state.fieldErrors?.business_name} autoComplete="organization" />
      <TextField label="Telefone / WhatsApp" name="phone" type="tel" inputMode="tel" defaultValue={v.phone} error={state.fieldErrors?.phone} placeholder="(11) 99999-0000" autoComplete="tel" />
      <TextField label="Endereço (opcional)" name="address" defaultValue={v.address} error={state.fieldErrors?.address} placeholder="Rua das Flores, 10 · Jardins" />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-label-md text-ink">
          Descrição curta (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={v.description}
          aria-invalid={state.fieldErrors?.description ? true : undefined}
          className={`rounded-card border-[1.5px] bg-card px-4 py-3 text-base text-ink outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 ${
            state.fieldErrors?.description ? 'border-danger' : 'border-border-soft'
          }`}
        />
        {state.fieldErrors?.description && <p className="text-sm text-danger">{state.fieldErrors.description}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="logo" className="text-label-md text-ink">
          Logo (opcional)
        </label>
        {defaults.logo_url && (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL pública do Supabase Storage */}
            <img src={defaults.logo_url} alt="Logo atual" className="h-16 w-16 rounded-full object-cover" />
            <label className="flex h-11 items-center gap-2 text-label-md text-ink">
              <input type="checkbox" name="remove_logo" className="h-5 w-5 accent-brand" />
              Remover logo
            </label>
          </div>
        )}
        <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm text-muted file:mr-4 file:h-11 file:rounded-full file:border-0 file:bg-subtle file:px-5 file:text-label-md file:text-ink" />
        <p className={`text-sm ${state.fieldErrors?.logo ? 'text-danger' : 'text-muted'}`} role={state.fieldErrors?.logo ? 'alert' : undefined}>
          {state.fieldErrors?.logo ?? 'PNG, JPG ou WebP, até 1 MB. Fica melhor quadrada.'}
        </p>
      </div>

      <SubmitButton>Salvar configurações</SubmitButton>
    </form>
  )
}
