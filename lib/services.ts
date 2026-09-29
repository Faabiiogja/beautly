const MAX_NAME = 80
const MAX_DURATION_MINUTES = 600
const MAX_PRICE_CENTS = 10_000_000

// "85", "85,00", "R$ 1.234,56", "49.90" -> centavos. null se não for um preço válido.
export function parsePriceToCents(raw: string): number | null {
  let text = raw.replace(/R\$|\s/g, '')
  if (!text) return null
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null
  const cents = Math.round(Number(text) * 100)
  return cents <= MAX_PRICE_CENTS ? cents : null
}

export function formatPriceInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

export type ServiceValue = { name: string; price_cents: number; duration_minutes: number }
export type ServiceErrors = { name?: string; price?: string; duration?: string }
export type ServiceResult = { ok: true; value: ServiceValue } | { ok: false; errors: ServiceErrors }

export function validateService(input: { name: string; price: string; duration: string }): ServiceResult {
  const errors: ServiceErrors = {}
  const name = input.name.trim()
  if (!name) errors.name = 'Informe o nome do serviço.'
  else if (name.length > MAX_NAME) errors.name = `Use no máximo ${MAX_NAME} caracteres.`

  const price_cents = parsePriceToCents(input.price)
  if (price_cents === null) errors.price = 'Informe um preço válido, como 85,00.'

  const duration_minutes = /^\d+$/.test(input.duration.trim()) ? Number(input.duration.trim()) : NaN
  if (!Number.isInteger(duration_minutes) || duration_minutes <= 0) errors.duration = 'Informe a duração em minutos, como 60.'
  else if (duration_minutes > MAX_DURATION_MINUTES) errors.duration = `A duração máxima é ${MAX_DURATION_MINUTES} minutos.`

  if (errors.name || errors.price || errors.duration || price_cents === null) return { ok: false, errors }
  return { ok: true, value: { name, price_cents, duration_minutes } }
}
