'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createScheduleBlock } from '../actions'

export function BlockDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const startAt = form.get('start_at') as string
    const endAt = form.get('end_at') as string
    const reason = (form.get('reason') as string) || null

    // datetime-local gives "YYYY-MM-DDTHH:mm", convert to ISO 8601
    const input = {
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      reason,
    }

    startTransition(async () => {
      const result = await createScheduleBlock(input)
      if (!result.success) {
        toast.error('Dados inválidos')
        return
      }
      toast.success('Bloqueio criado')
      setOpen(false)
    })
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-stone-900 mb-5">Novo bloqueio</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Início</label>
                <input
                  name="start_at"
                  type="datetime-local"
                  required
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Fim</label>
                <input
                  name="end_at"
                  type="datetime-local"
                  required
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Motivo (opcional)</label>
                <input
                  name="reason"
                  type="text"
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-60"
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
