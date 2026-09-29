export type DayInput = { closed: boolean; start: string; end: string }
export type WorkingHoursRow = { weekday: number; closed: boolean; start_time: string | null; end_time: string | null }
export type WeekResult =
  | { ok: true; rows: WorkingHoursRow[] }
  | { ok: false; errors: Record<number, string> }

export const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
// weekday segue o Postgres (0 = domingo); a tela mostra de segunda a domingo.
export const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

// Sugestão inicial (não é salva até a profissional confirmar): seg-sex 09-18, fim de semana fechado.
export function defaultWeek(): DayInput[] {
  return Array.from({ length: 7 }, (_, weekday) =>
    weekday === 0 || weekday === 6 ? { closed: true, start: '', end: '' } : { closed: false, start: '09:00', end: '18:00' },
  )
}

// `days` é indexado por weekday (0 = domingo).
export function validateWeek(days: DayInput[]): WeekResult {
  if (days.length !== 7) return { ok: false, errors: { 0: 'Informe os 7 dias da semana.' } }
  const errors: Record<number, string> = {}
  const rows: WorkingHoursRow[] = days.map((day, weekday) => {
    if (day.closed) return { weekday, closed: true, start_time: null, end_time: null }
    if (!TIME.test(day.start) || !TIME.test(day.end)) errors[weekday] = 'Informe o horário de início e de fim.'
    else if (day.start >= day.end) errors[weekday] = 'O início precisa ser antes do fim.'
    return { weekday, closed: false, start_time: day.start, end_time: day.end }
  })
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, rows }
}

// Dia bloqueado: data real, hoje ou futura (today = YYYY-MM-DD em America/Sao_Paulo).
export function validateBlockedDay(day: string, today: string): { ok: true; value: string } | { ok: false; error: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return { ok: false, error: 'Escolha uma data.' }
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const real = new Date(Date.UTC(y, m - 1, d))
  if (real.getUTCFullYear() !== y || real.getUTCMonth() !== m - 1 || real.getUTCDate() !== d) return { ok: false, error: 'Data inválida.' }
  if (day < today) return { ok: false, error: 'Escolha hoje ou uma data futura.' }
  return { ok: true, value: day }
}
