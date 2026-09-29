// Telefone brasileiro: DDD (11-99) + celular de 9 dígitos começando em 9, ou fixo de 8 dígitos
// começando em 2-5. Aceita máscara, espaços e DDI 55. Retorna só os dígitos, ou null.
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '')
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2)
  if (!/^[1-9][1-9]/.test(digits)) return null
  const number = digits.slice(2)
  if (number.length === 9 && number.startsWith('9')) return digits
  if (number.length === 8 && /^[2-5]/.test(number)) return digits
  return null
}

// "11999990000" -> "(11) 99999-0000". Texto não reconhecido volta como está.
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return value
}
