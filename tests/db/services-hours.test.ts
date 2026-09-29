import type { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { as, createService, createTenant, freshDb, insertAppointment } from './helpers'

let db: Client
let ana: string
let service: string

beforeAll(async () => {
  db = await freshDb()
  ana = await createTenant(db, 'ana')
  service = await createService(db, ana)
  await insertAppointment(db, ana, service, '2026-10-05T13:00Z', '2026-10-05T14:00Z')
})

afterAll(() => db.end())

describe('serviços com agendamentos existentes', () => {
  it('editar ou inativar o serviço não altera o snapshot do agendamento', async () => {
    await as(db, 'authenticated', ana, async () => {
      await db.query(`update services set name = 'Novo nome', price_cents = 9900, duration_minutes = 30, active = false where id = $1`, [service])
    })
    const { rows } = await db.query('select service_name_snapshot, price_cents_snapshot, duration_minutes_snapshot from appointments')
    expect(rows).toEqual([{ service_name_snapshot: 'Manicure', price_cents_snapshot: 5000, duration_minutes_snapshot: 60 }])
  })

  it('não permite apagar serviço com agendamento (só inativar)', async () => {
    await as(db, 'authenticated', ana, async () => {
      await expect(db.query('delete from services where id = $1', [service])).rejects.toMatchObject({ code: '23001' })
    })
  })
})

describe('expediente e dias bloqueados', () => {
  it('um registro por dia da semana por tenant (upsert)', async () => {
    await as(db, 'authenticated', ana, async () => {
      const sql = `insert into working_hours (tenant_id, weekday, start_time, end_time) values ($1, 1, $2, '18:00')
                   on conflict (tenant_id, weekday) do update set start_time = excluded.start_time`
      await db.query(sql, [ana, '09:00'])
      await db.query(sql, [ana, '10:00'])
      const { rows } = await db.query('select start_time from working_hours where weekday = 1')
      expect(rows).toHaveLength(1)
      expect(rows[0].start_time).toBe('10:00:00')
    })
  })

  it('dia aberto exige início antes do fim; fechado dispensa horários', async () => {
    await as(db, 'authenticated', ana, async () => {
      await expect(
        db.query(`insert into working_hours (tenant_id, weekday, start_time, end_time) values ($1, 2, '18:00', '09:00')`, [ana]),
      ).rejects.toMatchObject({ code: '23514' })
    })
    await as(db, 'authenticated', ana, async () => {
      await db.query(`insert into working_hours (tenant_id, weekday, closed) values ($1, 0, true)`, [ana])
    })
  })

  it('mesmo dia não pode ser bloqueado duas vezes', async () => {
    await db.query(`insert into blocked_days (tenant_id, day) values ($1, '2026-12-25')`, [ana])
    await expect(db.query(`insert into blocked_days (tenant_id, day) values ($1, '2026-12-25')`, [ana])).rejects.toMatchObject({ code: '23505' })
  })

  it('bloquear um dia não cancela agendamento confirmado nele', async () => {
    await db.query(`insert into blocked_days (tenant_id, day) values ($1, '2026-10-05')`, [ana])
    const { rows } = await db.query(`select status from appointments where start_time = '2026-10-05T13:00Z'`)
    expect(rows).toEqual([{ status: 'confirmed' }])
  })
})
