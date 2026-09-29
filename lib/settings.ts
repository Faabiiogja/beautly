import { normalizePhone } from '@/lib/phone'

export const LOGO_BUCKET = 'logos'
export const MAX_LOGO_BYTES = 1_000_000

export type SettingsInput = { business_name: string; phone: string; address: string; description: string }
export type SettingsValue = { business_name: string; phone: string; address: string | null; description: string | null }
export type SettingsErrors = Partial<Record<keyof SettingsInput, string>>
export type SettingsResult = { ok: true; value: SettingsValue } | { ok: false; errors: SettingsErrors }

export function validateSettings(input: SettingsInput): SettingsResult {
  const errors: SettingsErrors = {}
  const business_name = input.business_name.trim()
  const address = input.address.trim()
  const description = input.description.trim()
  const phone = normalizePhone(input.phone)

  if (!business_name) errors.business_name = 'Informe o nome do seu negócio.'
  else if (business_name.length > 80) errors.business_name = 'Use no máximo 80 caracteres.'
  if (!phone) errors.phone = 'Informe um telefone válido com DDD, como (11) 99999-0000.'
  if (address.length > 160) errors.address = 'Use no máximo 160 caracteres.'
  if (description.length > 280) errors.description = 'Use no máximo 280 caracteres.'

  if (Object.keys(errors).length || !phone) return { ok: false, errors }
  return { ok: true, value: { business_name, phone, address: address || null, description: description || null } }
}

// Tipo real da imagem pelos bytes iniciais (o Content-Type do navegador é falsificável).
// Só PNG, JPEG e WebP; SVG fica de fora de propósito (pode carregar script).
export function detectImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const startsWith = (...sig: number[]) => sig.every((b, i) => bytes[i] === b)
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: 'image/png', ext: 'png' }
  if (startsWith(0xff, 0xd8, 0xff)) return { mime: 'image/jpeg', ext: 'jpg' }
  if (startsWith(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50)
    return { mime: 'image/webp', ext: 'webp' }
  return null
}

// URL pública -> caminho do objeto no bucket, só se estiver na pasta do próprio tenant.
export function logoPathFromUrl(url: string | null, tenantId: string): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${LOGO_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  let path: string
  try {
    path = decodeURIComponent(url.slice(index + marker.length).split('?')[0])
  } catch {
    return null // URL com % malformado: não há objeto a apagar
  }
  return path.startsWith(`${tenantId}/`) && !path.includes('..') ? path : null
}
