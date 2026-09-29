// Valores de ?aviso= da lista de agendamentos (resultado de um cancelamento) e o texto de cada um.
export const AVISO = { cancelled: 'cancelado', notCancelled: 'nao-cancelado' } as const

export const AVISO_TEXT: Record<string, { tone: 'info' | 'error'; text: string }> = {
  [AVISO.cancelled]: { tone: 'info', text: 'Agendamento cancelado. O horário já está livre para novas clientes.' },
  [AVISO.notCancelled]: { tone: 'error', text: 'Não foi possível cancelar: o agendamento já foi cancelado, já terminou ou não existe mais. A lista abaixo mostra a situação atual.' },
}
