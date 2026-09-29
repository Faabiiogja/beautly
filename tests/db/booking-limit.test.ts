import type { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createService, createTenant, freshDb, reconnect } from './helpers'

let db: Client
let ana: string
let bia: string
let anaService: string
let biaService: string

const LIMIT_REACHED = 'BK001'
// n horas a partir de agora (sempre futuro), cada agendamento com 1h
const at = (hours: number) => `now() + interval '${hours} hours'`

async function book(client: Client, tenant: string, service: string, phone: string, startHours: number, status = 'confirmed') {
  return client.query(
    `insert into appointments (tenant_id, service_id, service_name_snapshot, price_cents_snapshot, duration_minutes_snapshot,
       client_name, client_phone, start_time, end_time, status)
     values ($1, $2, 'Manicure', 5000, 60, 'Maria', $3, ${at(startHours)}, ${at(startHours + 1)}, $4)`,
    [tenant, service, phone, status],
  )
}

beforeAll(async () => {
  db = await freshDb()
  ana = await createTenant(db, 'ana')
  bia = await createTenant(db, 'bia')
  anaService = await createService(db, ana)
  biaService = await createService(db, bia)
})

afterAll(() => db.end())

describe('teto de 3 agendamentos futuros por telefone', () => {
  it('aceita 3 e recusa o 4º do mesmo telefone no mesmo tenant', async () => {
    const phone = '11911110001'
    await book(db, ana, anaService, phone, 10)
    await book(db, ana, anaService, phone, 12)
    await book(db, ana, anaService, phone, 14)
    await expect(book(db, ana, anaService, phone, 16)).rejects.toMatchObject({ code: LIMIT_REACHED })
  })

  it('outro telefone e outro tenant têm o próprio teto', async () => {
    await book(db, ana, anaService, '11911110002', 20)
    await book(db, bia, biaService, '11911110001', 20) // mesmo telefone, outro tenant
  })

  it('cancelar libera uma vaga', async () => {
    const phone = '11911110003'
    for (const h of [30, 32, 34]) await book(db, ana, anaService, phone, h)
    await expect(book(db, ana, anaService, phone, 36)).rejects.toMatchObject({ code: LIMIT_REACHED })
    await db.query(`update appointments set status = 'cancelled', cancelled_at = now() where client_phone = $1 and tenant_id = $2 and start_time < now() + interval '31 hours'`, [phone, ana])
    await book(db, ana, anaService, phone, 36)
  })

  it('agendamentos cancelados e já passados não contam', async () => {
    const phone = '11911110004'
    await book(db, ana, anaService, phone, 40, 'cancelled')
    await book(db, ana, anaService, phone, 42, 'cancelled')
    await book(db, ana, anaService, phone, 44, 'cancelled')
    await book(db, ana, anaService, phone, -5) // já terminou
    await book(db, ana, anaService, phone, -8)
    for (const h of [46, 48, 50]) await book(db, ana, anaService, phone, h)
    await expect(book(db, ana, anaService, phone, 52)).rejects.toMatchObject({ code: LIMIT_REACHED })
  })

  it('inserir já cancelado não é bloqueado pelo teto', async () => {
    const phone = '11911110005'
    for (const h of [60, 62, 64]) await book(db, ana, anaService, phone, h)
    await book(db, ana, anaService, phone, 66, 'cancelled')
  })

  it('pedidos simultâneos não furam o teto', async () => {
    const phone = '11911110006'
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, async (_, i) => {
        const client = await reconnect(db)
        try {
          await book(client, ana, anaService, phone, 100 + i * 2)
        } finally {
          await client.end()
        }
      }),
    )
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(3)
    for (const r of results.filter((r) => r.status === 'rejected')) {
      expect((r as PromiseRejectedResult).reason.code).toBe(LIMIT_REACHED)
    }
  })
})
