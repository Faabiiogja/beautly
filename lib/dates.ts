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
