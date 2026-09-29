'use server'

import { revalidatePath } from 'next/cache'
import { requirePanelSession } from '@/lib/auth/dal'
import { detectImageType, LOGO_BUCKET, logoPathFromUrl, MAX_LOGO_BYTES, validateSettings, type SettingsErrors } from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'

export type SettingsFormState = {
  error?: string
  fieldErrors?: SettingsErrors & { logo?: string }
  values?: { business_name: string; phone: string; address: string; description: string }
  savedAt?: number
}

export async function saveSettings(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const tenant = await requirePanelSession()
  const values = {
    business_name: String(formData.get('business_name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    address: String(formData.get('address') ?? ''),
    description: String(formData.get('description') ?? ''),
  }
  const parsed = validateSettings(values)
  const logo = formData.get('logo')
  const removeLogo = formData.get('remove_logo') === 'on'
  const hasNewLogo = logo instanceof File && logo.size > 0

  // Valida o arquivo antes de gravar qualquer coisa
  let image: { bytes: Uint8Array; mime: string; ext: string } | null = null
  let logoError: string | undefined
  if (hasNewLogo) {
    if (logo.size > MAX_LOGO_BYTES) logoError = 'A imagem precisa ter até 1 MB.'
    else {
      const bytes = new Uint8Array(await logo.arrayBuffer())
      const type = detectImageType(bytes)
      if (!type) logoError = 'Use uma imagem PNG, JPG ou WebP.'
      else image = { bytes, ...type }
    }
  }
  if (!parsed.ok || logoError) return { fieldErrors: { ...(parsed.ok ? {} : parsed.errors), logo: logoError }, values }

  const supabase = await createClient()
  const { data: current } = await supabase.from('tenants').select('logo_url').eq('id', tenant.id).maybeSingle()
  const oldPath = logoPathFromUrl(current?.logo_url ?? null, tenant.id)

  let logo_url: string | null | undefined // undefined = não mexe
  let newPath: string | null = null
  if (image) {
    // A pasta é sempre a do tenant da sessão; o nome é novo a cada envio (evita cache de CDN)
    newPath = `${tenant.id}/logo-${Date.now()}.${image.ext}`
    const { error } = await supabase.storage.from(LOGO_BUCKET).upload(newPath, image.bytes, { contentType: image.mime })
    if (error) return { error: 'Não foi possível enviar o logo. Tente novamente.', values }
    logo_url = supabase.storage.from(LOGO_BUCKET).getPublicUrl(newPath).data.publicUrl
  } else if (removeLogo) {
    logo_url = null
  }

  const { data, error } = await supabase
    .from('tenants')
    .update({ ...parsed.value, ...(logo_url !== undefined ? { logo_url } : {}) })
    .eq('id', tenant.id)
    .select('id')
  if (error || !data?.length) {
    if (newPath) await supabase.storage.from(LOGO_BUCKET).remove([newPath])
    return { error: 'Não foi possível salvar as configurações. Tente novamente.', values }
  }

  // Só apaga o logo antigo depois de o novo estar salvo
  if (oldPath && logo_url !== undefined) await supabase.storage.from(LOGO_BUCKET).remove([oldPath])

  revalidatePath('/configuracoes')
  return { savedAt: Date.now() }
}
