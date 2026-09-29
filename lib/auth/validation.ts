const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

export function validateEmail(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim().toLowerCase()
  if (!value) return { ok: false, error: 'Informe seu e-mail.' }
  if (!EMAIL.test(value)) return { ok: false, error: 'Digite um e-mail válido.' }
  return { ok: true, value }
}

export type LoginResult =
  | { ok: true; email: string; password: string }
  | { ok: false; errors: { email?: string; password?: string } }

export function validateLogin(email: string, password: string): LoginResult {
  const errors: { email?: string; password?: string } = {}
  const parsed = validateEmail(email)
  if (!parsed.ok) errors.email = parsed.error
  if (!password) errors.password = 'Informe sua senha.'
  if (!parsed.ok || errors.password) return { ok: false, errors }
  return { ok: true, email: parsed.value, password }
}

export type NewPasswordResult =
  | { ok: true; password: string }
  | { ok: false; errors: { password?: string; confirm?: string } }

export function validateNewPassword(password: string, confirm: string): NewPasswordResult {
  const errors: { password?: string; confirm?: string } = {}
  if (password.length < MIN_PASSWORD) errors.password = `Use pelo menos ${MIN_PASSWORD} caracteres.`
  else if (password !== confirm) errors.confirm = 'As senhas não são iguais.'
  return errors.password || errors.confirm ? { ok: false, errors } : { ok: true, password }
}
