'use client'

import { useActionState } from 'react'
import { confirmBooking } from '@/domain/bookings/actions'
import type { ConfirmBookingResult } from '@/domain/bookings/types'

interface ConfirmFormProps {
  serviceId: string
  professionalId: string
  slot: string
  primary: string
  serviceName: string
  professionalName: string
  slotLabel: string
}

export function ConfirmForm({
  serviceId,
  professionalId,
  slot,
  primary,
  serviceName,
  professionalName,
  slotLabel,
}: ConfirmFormProps) {
  const [state, formAction, isPending] = useActionState<
    ConfirmBookingResult | null,
    FormData
  >(confirmBooking, null)

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Hidden inputs */}
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="professionalId" value={professionalId} />
      <input type="hidden" name="slot" value={slot} />

      {/* Resumo do agendamento */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400 mb-3">
          Resumo
        </p>
        <dl className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm text-stone-500">Serviço</dt>
            <dd className="text-sm font-medium text-stone-900 text-right">{serviceName}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm text-stone-500">Profissional</dt>
            <dd className="text-sm font-medium text-stone-900 text-right">{professionalName}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm text-stone-500">Horário</dt>
            <dd className="text-sm font-medium text-stone-900 text-right">{slotLabel}</dd>
          </div>
        </dl>
      </div>

      {/* Error banners */}
      {state && !state.success && state.error === 'slot_unavailable' && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          Este horário não está mais disponível. Por favor, escolha outro horário.
        </div>
      )}
      {state && !state.success && state.error === 'server_error' && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          Ocorreu um erro no servidor. Tente novamente em instantes.
        </div>
      )}
      {state?.error && state.error !== 'slot_unavailable' && state.error !== 'server_error' && !state.fieldErrors && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-4">
          Não foi possível confirmar. Verifique os dados e tente novamente.
        </div>
      )}

      {/* Seus dados */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 flex flex-col gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
          Seus dados
        </p>

        {/* Nome */}
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-stone-700 mb-1.5">
            Nome completo
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            autoComplete="name"
            aria-invalid={!!state?.fieldErrors?.customerName}
            className={[
              'rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-stone-400 w-full',
              fieldErrors?.customerName ? 'border-red-300' : 'border-stone-200',
            ].join(' ')}
          />
          {fieldErrors?.customerName && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.customerName[0]}</p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-stone-700 mb-1.5">
            Telefone (WhatsApp)
          </label>
          <input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            autoComplete="tel"
            placeholder="+5511999999999"
            aria-invalid={!!state?.fieldErrors?.customerPhone}
            className={[
              'rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-stone-400 w-full',
              fieldErrors?.customerPhone ? 'border-red-300' : 'border-stone-200',
            ].join(' ')}
          />
          {fieldErrors?.customerPhone && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.customerPhone[0]}</p>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className={[
          'rounded-full w-full py-3.5 text-sm font-semibold text-white',
          isPending ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
        style={{ backgroundColor: primary }}
      >
        {isPending ? 'Confirmando...' : 'Confirmar agendamento'}
      </button>
    </form>
  )
}
