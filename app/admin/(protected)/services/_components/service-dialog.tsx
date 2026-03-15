'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createService, updateService } from '../actions'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number | null
  description: string | null
  is_active: boolean
}

interface ServiceDialogProps {
  service?: Service
  trigger: React.ReactNode
}

export function ServiceDialog({ service, trigger }: ServiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const input = {
      name: form.get('name') as string,
      duration_minutes: Number(form.get('duration_minutes')),
      price: form.get('price') ? Number(form.get('price')) : null,
      description: (form.get('description') as string) || null,
    }

    startTransition(async () => {
      const result = service
        ? await updateService(service.id, input)
        : await createService(input)

      if (!result.success) {
        toast.error(result.error === 'validation_error' ? 'Dados inválidos' : 'Erro ao salvar')
        return
      }

      toast.success(service ? 'Serviço atualizado' : 'Serviço criado')
      setOpen(false)
    })
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-stone-900 mb-5">
              {service ? 'Editar serviço' : 'Novo serviço'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Nome</label>
                <input
                  name="name"
                  defaultValue={service?.name}
                  required
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Duração (minutos)</label>
                <input
                  name="duration_minutes"
                  type="number"
                  min="1"
                  defaultValue={service?.duration_minutes ?? 60}
                  required
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Preço (opcional)</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={service?.price ?? ''}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Descrição (opcional)</label>
                <textarea
                  name="description"
                  defaultValue={service?.description ?? ''}
                  rows={3}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-600 disabled:opacity-60"
                >
                  {isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
