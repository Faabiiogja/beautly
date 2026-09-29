import { describe, expect, it } from 'vitest'
import { decidePanelAccess } from '@/lib/panel-access'

const user = { id: 'u1' }
const tenant = { id: 'u1', business_name: 'Studio da Ana', subdomain: 'ana', active: true }

describe('decidePanelAccess', () => {
  it('manda para o login quando não há usuária logada', () => {
    expect(decidePanelAccess(null, null)).toEqual({ kind: 'login' })
  })

  it('libera tenant ativo', () => {
    expect(decidePanelAccess(user, tenant)).toEqual({ kind: 'ok', tenant })
  })

  it('bloqueia tenant inativo', () => {
    expect(decidePanelAccess(user, { ...tenant, active: false })).toEqual({ kind: 'blocked' })
  })

  it('bloqueia usuária autenticada sem tenant (login existe mas o founder não criou o tenant)', () => {
    expect(decidePanelAccess(user, null)).toEqual({ kind: 'blocked' })
  })
})
