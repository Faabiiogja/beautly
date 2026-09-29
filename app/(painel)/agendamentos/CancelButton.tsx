import { formatPrice } from '@/lib/format'
import { PendingButton } from './PendingButton'
import { CloseDetailsButton } from './CloseDetailsButton'
import { cancelAppointment } from './actions'

// Renderizado no servidor com <details>: a confirmação (ver e submeter) funciona sem JavaScript —
// abrir o <details> já mostra o formulário; clicar em "Cancelar" de novo fecha. O visual de
// diálogo (desktop) / bottom sheet (celular) é só CSS, via group-open: no wrapper.
export function CancelButton({
  id,
  clientName,
  serviceName,
  priceCents,
  whenLabel,
  phone,
}: {
  id: string
  clientName: string
  serviceName: string
  priceCents: number
  whenLabel: string
  phone: string
}) {
  const titleId = `cancelar-${id}`
  return (
    <details className="group relative inline-block text-left">
      <summary
        aria-label={`Cancelar agendamento de ${clientName}`}
        className="flex h-10 cursor-pointer list-none items-center rounded-full border-[1.5px] border-border-soft bg-card px-4 text-label-md text-ink transition hover:border-danger hover:text-danger [&::-webkit-details-marker]:hidden"
      >
        Cancelar
      </summary>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 z-50 hidden items-end justify-center bg-ink/40 group-open:flex sm:items-center sm:p-4"
      >
        <form
          action={cancelAppointment}
          className="flex w-full max-w-[440px] flex-col gap-4 rounded-t-panel bg-card p-6 shadow-soft sm:rounded-panel"
        >
          <input type="hidden" name="id" value={id} />

          <div className="mx-auto -mt-2 h-1.5 w-12 rounded-full bg-border-soft sm:hidden" />

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-tint text-danger">
            <span aria-hidden className="text-2xl leading-none">
              !
            </span>
          </div>

          <h3 id={titleId} className="font-headline text-headline-md text-ink">
            Cancelar o agendamento de {clientName}?
          </h3>

          <div className="flex flex-col gap-1 rounded-card border border-border-soft bg-subtle p-3.5 text-sm">
            <div className="flex items-center justify-between font-semibold text-ink">
              <span>{serviceName}</span>
              <span className="text-primary">{formatPrice(priceCents)}</span>
            </div>
            <p className="text-muted">
              {whenLabel} · {phone}
            </p>
          </div>

          <p className="text-sm text-muted">O horário volta a ficar livre para outras clientes na sua página pública de reservas.</p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <CloseDetailsButton className="inline-flex h-[52px] items-center justify-center rounded-full border-[1.5px] border-border-soft bg-card px-6 text-label-lg text-ink transition hover:bg-subtle sm:w-auto">
              Manter
            </CloseDetailsButton>
            <PendingButton pendingText="Cancelando…">Confirmar cancelamento</PendingButton>
          </div>
        </form>
      </div>
    </details>
  )
}
