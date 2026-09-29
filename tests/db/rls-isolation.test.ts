import type { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { as, createService, createTenant, freshDb, insertAppointment } from './helpers'

let db: Client
let ana: string
let bia: string
let anaService: string

beforeAll(async () => {
  db = await freshDb()
  ana = await createTenant(db, 'ana')
  bia = await createTenant(db, 'bia')
  anaService = await createService(db, ana)
  await db.query(`insert into working_hours (tenant_id, weekday, start_time, end_time) values ($1, 1, '09:00', '18:00')`, [ana])
  await db.query(`insert into blocked_days (tenant_id, day) values ($1, '2026-12-25')`, [ana])
  await insertAppointment(db, ana, anaService, '2026-10-05T13:00Z', '2026-10-05T14:00Z')
})

afterAll(() => db.end())

const count = async (table: string) =>
  Number((await db.query(`select count(*) from ${table}`)).rows[0].count)

describe('profissional autenticada', () => {
  it('vê todos os dados do próprio tenant', async () => {
    await as(db, 'authenticated', ana, async () => {
      expect(await count('tenants')).toBe(1)
      expect(await count('services')).toBe(1)
      expect(await count('working_hours')).toBe(1)
      expect(await count('blocked_days')).toBe(1)
      expect(await count('appointments')).toBe(1)
    })
  })

  it('não enxerga nada de outro tenant', async () => {
    await as(db, 'authenticated', bia, async () => {
      const own = await db.query('select id from tenants')
      expect(own.rows.map((r) => r.id)).toEqual([bia])
      expect(await count('services')).toBe(0)
      expect(await count('working_hours')).toBe(0)
      expect(await count('blocked_days')).toBe(0)
      expect(await count('appointments')).toBe(0)
    })
  })

  it('não consegue inserir dados em nome de outro tenant', async () => {
    await as(db, 'authenticated', bia, async () => {
      await expect(
        db.query(`insert into services (tenant_id, name, price_cents, duration_minutes) values ($1, 'X', 1, 30)`, [ana]),
      ).rejects.toMatchObject({ code: '42501' })
    })
  })

  it('não consegue inserir em nenhuma tabela em nome de outro tenant', async () => {
    const inserts = [
      [`insert into working_hours (tenant_id, weekday, start_time, end_time) values ($1, 2, '09:00', '18:00')`],
      [`insert into blocked_days (tenant_id, day) values ($1, '2026-12-31')`],
      [`insert into appointments (tenant_id, service_id, service_name_snapshot, price_cents_snapshot, duration_minutes_snapshot, client_name, client_phone, start_time, end_time) values ($1, '${anaService}', 'X', 1, 30, 'M', '11988888888', '2026-11-01T13:00Z', '2026-11-01T14:00Z')`],
    ]
    for (const [sql] of inserts) {
      await as(db, 'authenticated', bia, async () => {
        await expect(db.query(sql, [ana])).rejects.toMatchObject({ code: '42501' })
      })
    }
  })

  it('não consegue mover uma linha própria para outro tenant', async () => {
    const own = await createService(db, bia)
    await as(db, 'authenticated', bia, async () => {
      await expect(db.query('update services set tenant_id = $1 where id = $2', [ana, own])).rejects.toMatchObject({
        code: '42501',
      })
    })
  })

  it('não consegue alterar nem apagar dados de outro tenant', async () => {
    await as(db, 'authenticated', bia, async () => {
      const upd = await db.query(`update services set name = 'hack' where id = $1`, [anaService])
      const del = await db.query(`delete from services where id = $1`, [anaService])
      expect(upd.rowCount).toBe(0)
      expect(del.rowCount).toBe(0)
    })
    const { rows } = await db.query('select name from services where id = $1', [anaService])
    expect(rows[0].name).toBe('Manicure')
  })
})

describe('visitante anônimo (página pública)', () => {
  it('lê tenant ativo, serviços ativos, expediente e dias bloqueados', async () => {
    await as(db, 'anon', null, async () => {
      expect(await count('tenants')).toBeGreaterThanOrEqual(2)
      const { rows } = await db.query('select id from services where tenant_id = $1', [ana])
      expect(rows.map((r) => r.id)).toEqual([anaService])
      expect(await count('working_hours')).toBe(1)
      expect(await count('blocked_days')).toBe(1)
    })
  })

  it('nunca lê agendamentos, nem escreve neles', async () => {
    await as(db, 'anon', null, async () => {
      await expect(db.query('select 1 from appointments')).rejects.toMatchObject({ code: '42501' })
    })
    await as(db, 'anon', null, async () => {
      await expect(insertAppointment(db, ana, anaService, '2026-10-06T13:00Z', '2026-10-06T14:00Z')).rejects.toMatchObject({
        code: '42501',
      })
    })
  })

  it('não consegue alterar nem apagar nada', async () => {
    for (const table of ['tenants', 'services', 'working_hours', 'blocked_days']) {
      for (const sql of [`update ${table} set created_at = now()`, `delete from ${table}`]) {
        await as(db, 'anon', null, async () => {
          await expect(db.query(sql)).rejects.toMatchObject({ code: '42501' })
        })
      }
    }
  })

  it('não vê tenant inativo nem o que pertence a ele', async () => {
    const off = await createTenant(db, 'inativa', { active: false })
    await createService(db, off)
    await as(db, 'anon', null, async () => {
      const subs = (await db.query('select subdomain from tenants')).rows.map((r) => r.subdomain)
      expect(subs).not.toContain('inativa')
      const { rows } = await db.query('select 1 from services where tenant_id = $1', [off])
      expect(rows).toHaveLength(0)
    })
  })

  it('não vê serviço inativo de tenant ativo', async () => {
    const hidden = await createService(db, bia, { active: false })
    await as(db, 'anon', null, async () => {
      const { rows } = await db.query('select 1 from services where id = $1', [hidden])
      expect(rows).toHaveLength(0)
    })
  })
})

describe('service role (rotas server-side)', () => {
  it('ignora RLS e lê agendamentos de qualquer tenant', async () => {
    await as(db, 'service_role', null, async () => {
      expect(await count('appointments')).toBe(1)
    })
  })
})

describe('regras de integridade do tenant', () => {
  it('rejeita subdomínio reservado e mal formatado', async () => {
    await expect(createTenant(db, 'painel')).rejects.toMatchObject({ code: '23514' })
    await expect(createTenant(db, 'Ana_Maria')).rejects.toMatchObject({ code: '23514' })
  })
})
