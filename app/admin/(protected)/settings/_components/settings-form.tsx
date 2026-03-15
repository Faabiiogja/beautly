'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateSettings } from '../actions'

interface SettingsFormProps {
  name: string
  primaryColor: string
}

export function SettingsForm({ name, primaryColor }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const input = {
      name: form.get('name') as string,
      primary_color: form.get('primary_color') as string,
    }

    startTransition(async () => {
      const result = await updateSettings(input)
      if (!result.success) {
        toast.error(result.error === 'validation_error' ? 'Dados inválidos' : 'Erro ao salvar')
        return
      }
      toast.success('Configurações salvas')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-stone-700">
          Nome do estabelecimento
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={name}
          required
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="primary_color" className="text-sm font-medium text-stone-700">
          Cor principal
        </label>
        <div className="flex items-center gap-3">
          <input
            id="primary_color"
            name="primary_color"
            type="color"
            defaultValue={primaryColor}
            className="h-10 w-16 cursor-pointer rounded-lg border border-stone-200 bg-white p-1"
          />
          <span className="text-sm text-stone-500">Usada nos botões e destaques do site</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-600 disabled:opacity-60"
      >
        {isPending ? 'Salvando…' : 'Salvar configurações'}
      </button>
    </form>
  )
}
