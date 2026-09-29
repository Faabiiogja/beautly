import type { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { as, createService, createTenant, freshDb, insertAppointment } from './helpers'

let db: Client
let off: string
let offService: string

beforeAll(async () => {
  db = await freshDb()
  off = await createTenant(db, 'inativa', { active: false })
  offService = await createService(db, off)
  await insertAppointment(db, off, offService, '2026-10-05T13:00Z', '2026-10-05T14:00Z')
})

afterAll(() => db.end())

describe('profissional de tenant inativo (JWT válido, chamando o banco direto)', () => {
  it('ainda lê a própria linha de tenant (o app decide "sem acesso")', async () => {
    await as(db, 'authenticated', off, async () => {
      const { rows } = await db.query('select active from tenants')
      expect(rows).toEqual([{ active: false }])
    })
  })

  it('não vê nem grava serviços, expediente, bloqueios ou agendamentos', async () => {
    await as(db, 'authenticated', off, async () => {
      for (const table of ['services', 'working_hours', 'blocked_days', 'appointments']) {
        expect((await db.query(`select 1 from ${table}`)).rowCount).toBe(0)
      }
    })
    await as(db, 'authenticated', off, async () => {
      await expect(
        db.query(`insert into services (tenant_id, name, price_cents, duration_minutes) values ($1, 'X', 1, 30)`, [off]),
      ).rejects.toMatchObject({ code: '42501' })
    })
    await as(db, 'authenticated', off, async () => {
      const upd = await db.query(`update services set name = 'x' where id = $1`, [offService])
      expect(upd.rowCount).toBe(0)
    })
  })

  it('não consegue se reativar', async () => {
    await as(db, 'authenticated', off, async () => {
      await expect(db.query('update tenants set active = true where id = $1', [off])).rejects.toMatchObject({ code: '42501' })
    })
  })
})

describe('profissional de tenant ativo', () => {
  it('edita o perfil, mas não subdomínio nem active', async () => {
    const on = await createTenant(db, 'ativa')
    await as(db, 'authenticated', on, async () => {
      const ok = await db.query(`update tenants set business_name = 'Novo nome' where id = $1`, [on])
      expect(ok.rowCount).toBe(1)
    })
    await as(db, 'authenticated', on, async () => {
      await expect(db.query(`update tenants set subdomain = 'outro' where id = $1`, [on])).rejects.toMatchObject({ code: '42501' })
    })
    await as(db, 'authenticated', on, async () => {
      await expect(db.query(`update tenants set active = false where id = $1`, [on])).rejects.toMatchObject({ code: '42501' })
    })
  })

  it('continua gerenciando os próprios serviços', async () => {
    const on = await createTenant(db, 'ativa2')
    await as(db, 'authenticated', on, async () => {
      await db.query(`insert into services (tenant_id, name, price_cents, duration_minutes) values ($1, 'Manicure', 5000, 60)`, [on])
      expect((await db.query('select 1 from services')).rowCount).toBe(1)
    })
  })
})
