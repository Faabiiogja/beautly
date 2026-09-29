export type AppointmentStatus = 'confirmed' | 'cancelled'
export type DisplayStatus = AppointmentStatus | 'past'

type Timed = { status: AppointmentStatus; end_time: string }

// Estado que a cliente vê. "Já ocorrido" não é armazenado: é um confirmado cujo horário já passou.
export function displayStatus(appointment: Timed, now: Date): DisplayStatus {
  if (appointment.status === 'cancelled') return 'cancelled'
  return new Date(appointment.end_time) <= now ? 'past' : 'confirmed'
}

// Só se cancela o que ainda não terminou: cancelar depois do horário não libera nada
// e apagaria o registro do que aconteceu.
export const canCancel = (appointment: Timed, now: Date): boolean => displayStatus(appointment, now) === 'confirmed'
