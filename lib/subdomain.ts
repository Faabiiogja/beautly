// Subdomínios que nunca são tenant (espelha a constraint subdomain_not_reserved do schema).
const RESERVED = new Set([
  'www', 'app', 'api', 'admin', 'beautly', 'mail', 'ftp',
  'static', 'cdn', 'docs', 'help', 'support', 'blog', 'painel',
])

// Mesmo formato exigido pela constraint subdomain_format do schema.
const VALID_LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

// Extrai o subdomínio do tenant a partir do header Host, ou null se a requisição não é de um tenant
// (apex, painel, subdomínio reservado, host de outro domínio, subdomínio aninhado).
export function extractSubdomain(host: string | null, rootDomain: string): string | null {
  if (!host) return null
  const hostname = host.toLowerCase().split(':')[0].replace(/\.$/, '')
  const suffix = `.${rootDomain.toLowerCase()}`
  if (!hostname.endsWith(suffix)) return null
  const subdomain = hostname.slice(0, -suffix.length)
  if (!VALID_LABEL.test(subdomain) || RESERVED.has(subdomain)) return null
  return subdomain
}

// true se o host é o subdomínio compartilhado do painel das profissionais.
export function isPanelHost(host: string | null, rootDomain: string): boolean {
  if (!host) return false
  const hostname = host.toLowerCase().split(':')[0].replace(/\.$/, '')
  return hostname === `painel.${rootDomain.toLowerCase()}`
}
