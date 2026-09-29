import { cancelAppointment } from './actions'
import { PendingButton } from './PendingButton'

// Renderizado no servidor com <details>: a confirmação funciona sem JavaScript
// (abrir = "Cancelar", clicar de novo fecha e desfaz).
export function CancelButton({ id, clientName }: { id: string; clientName: string }) {
  return (
    <details className="group inline-block text-left">
      <summary
        aria-label={`Cancelar agendamento de ${clientName}`}
        className="flex h-11 cursor-pointer list-none items-center rounded-full border-[1.5px] border-border-soft bg-card px-4 text-label-md text-ink [&::-webkit-details-marker]:hidden"
      >
        Cancelar
      </summary>
      <form action={cancelAppointment} className="mt-2 flex flex-col gap-2 rounded-card bg-danger-tint p-3">
        <input type="hidden" name="id" value={id} />
        <p className="text-sm text-ink">Cancelar o agendamento de {clientName}? O horário será liberado.</p>
        <PendingButton pendingText="Cancelando…">Confirmar cancelamento</PendingButton>
      </form>
    </details>
  )
}
