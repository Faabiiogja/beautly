export type PanelTenant = { id: string; business_name: string; active: boolean }

export type PanelAccess =
  | { kind: 'login' }
  | { kind: 'blocked' }
  | { kind: 'ok'; tenant: PanelTenant }

// Decide o que a requisição ao painel pode ver. Login sem tenant ou com tenant inativo é
// "blocked": a conta existe, mas o painel não abre (o founder ativa/desativa pelo Studio).
export function decidePanelAccess(user: { id: string } | null, tenant: PanelTenant | null): PanelAccess {
  if (!user) return { kind: 'login' }
  if (!tenant || !tenant.active) return { kind: 'blocked' }
  return { kind: 'ok', tenant }
}
