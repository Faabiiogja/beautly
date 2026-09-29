import { describe, expect, it } from 'vitest'
import { detectImageType, logoPathFromUrl, validateSettings } from '@/lib/settings'

const valid = { business_name: '  Studio da Ana ', phone: '(11) 99999-0000', address: ' Rua das Flores, 10 ', description: ' Manicure ' }

describe('validateSettings', () => {
  it('normaliza campos e guarda o telefone só com dígitos', () => {
    expect(validateSettings(valid)).toEqual({
      ok: true,
      value: { business_name: 'Studio da Ana', phone: '11999990000', address: 'Rua das Flores, 10', description: 'Manicure' },
    })
  })

  it('endereço e descrição vazios viram null', () => {
    expect(validateSettings({ ...valid, address: '  ', description: '' })).toMatchObject({
      ok: true,
      value: { address: null, description: null },
    })
  })

  it('exige nome e telefone brasileiro válido', () => {
    const r = validateSettings({ ...valid, business_name: ' ', phone: '123' })
    expect(r).toMatchObject({ ok: false, errors: { business_name: expect.any(String), phone: expect.any(String) } })
  })

  it('limita tamanhos', () => {
    expect(validateSettings({ ...valid, business_name: 'x'.repeat(81) })).toMatchObject({ ok: false, errors: { business_name: expect.any(String) } })
    expect(validateSettings({ ...valid, address: 'x'.repeat(161) })).toMatchObject({ ok: false, errors: { address: expect.any(String) } })
    expect(validateSettings({ ...valid, description: 'x'.repeat(281) })).toMatchObject({ ok: false, errors: { description: expect.any(String) } })
  })
})

describe('detectImageType', () => {
  const bytes = (...b: number[]) => new Uint8Array(b)
  it('reconhece PNG, JPEG e WebP pelos bytes iniciais', () => {
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toEqual({ mime: 'image/png', ext: 'png' })
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toEqual({ mime: 'image/jpeg', ext: 'jpg' })
    expect(detectImageType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toEqual({ mime: 'image/webp', ext: 'webp' })
  })
  it('rejeita o resto (SVG, HTML, GIF, vazio)', () => {
    expect(detectImageType(new TextEncoder().encode('<svg xmlns='))).toBeNull()
    expect(detectImageType(new TextEncoder().encode('<html><script>'))).toBeNull()
    expect(detectImageType(new TextEncoder().encode('GIF89a'))).toBeNull()
    expect(detectImageType(bytes())).toBeNull()
  })
})

describe('logoPathFromUrl', () => {
  const tenant = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb'
  it('extrai o caminho do objeto se for do próprio tenant', () => {
    const url = `https://x.supabase.co/storage/v1/object/public/logos/${tenant}/logo-1.png`
    expect(logoPathFromUrl(url, tenant)).toBe(`${tenant}/logo-1.png`)
  })
  it('ignora URLs de fora do bucket ou de outra pasta', () => {
    expect(logoPathFromUrl('https://outro.com/logo.png', tenant)).toBeNull()
    expect(logoPathFromUrl('https://x.supabase.co/storage/v1/object/public/logos/outro-tenant/logo.png', tenant)).toBeNull()
    expect(logoPathFromUrl(null, tenant)).toBeNull()
    expect(logoPathFromUrl(`https://x.supabase.co/storage/v1/object/public/logos/${tenant}/%E0%A4%A.png`, tenant)).toBeNull()
  })
})
