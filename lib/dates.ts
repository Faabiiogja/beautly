const TZ = 'America/Sao_Paulo'

// Data de hoje (YYYY-MM-DD) no fuso da plataforma. Nunca usar a data UTC: perto da virada do dia
// elas diferem (ver "Fuso horário na geração de disponibilidade" em docs/architecture.md).
export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

// "2026-12-25" -> "25/12/2026 (sexta-feira)"
export function formatLongDate(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  const weekday = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long' }).format(date)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} (${weekday})`
}

const zonedParts = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

// Diferença (ms) entre o relógio local de São Paulo e o UTC naquele instante. Calculada pelo Intl,
// então acompanha o horário de verão histórico em vez de assumir um offset fixo.
function offsetMs(at: Date): number {
  const p = Object.fromEntries(zonedParts.formatToParts(at).map((part) => [part.type, part.value]))
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second))
  return asUtc - Math.floor(at.getTime() / 1000) * 1000
}

// Data local (YYYY-MM-DD) + minutos desde a meia-noite local -> instante UTC correspondente.
export function localToUtc(day: string, minutes: number): Date {
  const [y, m, d] = day.split('-').map(Number)
  const naive = Date.UTC(y, m - 1, d, 0, minutes)
  const first = offsetMs(new Date(naive))
  let utc = naive - first
  const second = offsetMs(new Date(utc))
  if (second !== first) utc = naive - second // cruzou uma mudança de horário de verão
  return new Date(utc)
}

// Limites do dia local como instantes UTC: [start, end). Nunca usar meia-noite UTC para "o dia X".
export function dayBoundsUtc(day: string): { start: Date; end: Date } {
  return { start: localToUtc(day, 0), end: localToUtc(addDays(day, 1), 0) }
}

// Aritmética de datas sem fuso (só calendário): "2026-09-29" + n dias.
export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

// Dia da semana de uma data de calendário, com 0 = domingo (convenção do Postgres e de working_hours).
export function weekdayOf(day: string): number {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

const WEEKDAY_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// "2026-09-29" -> { weekday: 'Ter', dayNumber: '29', month: 'Set' } (carrossel de dias)
export function dayChipParts(day: string): { weekday: string; dayNumber: string; month: string } {
  const [, m, d] = day.split('-').map(Number)
  return { weekday: WEEKDAY_ABBR[weekdayOf(day)], dayNumber: String(d), month: MONTH_ABBR[m - 1] }
}

// "YYYY-MM-DD" que existe no calendário (rejeita 2026-02-30, mês 13 e formatos livres).
export function isRealDay(day: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return false
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}
