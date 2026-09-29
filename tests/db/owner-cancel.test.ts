import type { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { as, createService, createTenant, freshDb } from './helpers'

let db: Client
let ana: string
let bia: string
let anaService: string
let anaAppt: string
let biaAppt: string
let biaService: string

async function seed(tenant: string, service: string, hoursFromNow: number, phone: string) {
  const { rows } = await db.query(
    `insert into appointments (tenant_id, service_id, service_name_snapshot, price_cents_snapshot, duration_minutes_snapshot,
       client_name, client_phone, start_time, end_time)
     values ($1, $2, 'Manicure', 5000, 60, 'Maria', $3, now() + ($4 || ' hours')::interval, now() + ($4 || ' hours')::interval + interval '1 hour')
     returning id`,
    [tenant, service, phone, String(hoursFromNow)],
  )
  return rows[0].id as string
}

beforeAll(async () => {
  db = await freshDb()
  ana = await createTenant(db, 'ana')
  bia = await createTenant(db, 'bia')
  anaService = await createService(db, ana)
  biaService = await createService(db, bia)
  anaAppt = await seed(ana, anaService, 10, '11911110001')
  biaAppt = await seed(bia, biaService, 10, '11911110002')
})

afterAll(() => db.end())

describe('profissional cancelando pelo painel (client autenticado, sob RLS)', () => {
  it('vê só os agendamentos do próprio tenant', async () => {
    await as(db, 'authenticated', ana, async () => {
      const { rows } = await db.query('select id from appointments')
      expect(rows.map((r) => r.id)).toEqual([anaAppt])
    })
  })

  it('não cancela agendamento de outro tenant', async () => {
    await as(db, 'authenticated', ana, async () => {
      const r = await db.query(`update appointments set status = 'cancelled', cancelled_at = now() where id = $1`, [biaAppt])
      expect(r.rowCount).toBe(0)
    })
    expect((await db.query('select status from appointments where id = $1', [biaAppt])).rows[0].status).toBe('confirmed')
  })

  it('cancela o próprio e o horário fica livre para outra cliente na hora', async () => {
    // tudo na mesma transação (o helper reverte no fim): a dona cancela e, em seguida, a rota pública
    // (service role) consegue confirmar outra cliente exatamente no mesmo horário
    await as(db, 'authenticated', ana, async () => {
      const r = await db.query(
        `update appointments set status = 'cancelled', cancelled_at = now() where id = $1 and status = 'confirmed' returning id`,
        [anaAppt],
      )
      expect(r.rowCount).toBe(1)

      await db.query('set local role service_role')
      const again = await db.query(
        `insert into appointments (tenant_id, service_id, service_name_snapshot, price_cents_snapshot, duration_minutes_snapshot,
           client_name, client_phone, start_time, end_time)
         select tenant_id, service_id, 'Manicure', 5000, 60, 'Outra', '11933330000', start_time, end_time from appointments where id = $1`,
        [anaAppt],
      )
      expect(again.rowCount).toBe(1)
    })
  })

  it('sem cancelar, o mesmo horário continua ocupado', async () => {
    await as(db, 'service_role', null, async () => {
      await expect(
        db.query(
          `insert into appointments (tenant_id, service_id, service_name_snapshot, price_cents_snapshot, duration_minutes_snapshot,
             client_name, client_phone, start_time, end_time)
           select tenant_id, service_id, 'Manicure', 5000, 60, 'Outra', '11933330000', start_time, end_time from appointments where id = $1`,
          [anaAppt],
        ),
      ).rejects.toMatchObject({ code: '23P01' })
    })
  })

  it('tenant inativo não cancela (as policies exigem tenant ativo)', async () => {
    const off = await createTenant(db, 'inativa', { active: false })
    const offService = await createService(db, off)
    const id = await seed(off, offService, 5, '11911110009')
    await as(db, 'authenticated', off, async () => {
      const r = await db.query(`update appointments set status = 'cancelled' where id = $1`, [id])
      expect(r.rowCount).toBe(0)
    })
  })
})
