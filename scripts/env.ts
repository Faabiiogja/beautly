import { readFileSync } from 'node:fs'

// Parser mínimo de .env (KEY=valor por linha) — não precisamos de mais que isso (sem interpolação,
// sem multilinha) e evita uma dependência só pra isso.
export function loadEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim())
    if (match) out[match[1]] = match[2]
  }
  return out
}
