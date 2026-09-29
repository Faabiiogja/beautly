import type { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createService, createTenant, freshDb, insertAppointment, reconnect } from './helpers'

let db: Client
let ana: string
let bia: string
let anaService: string
let biaService: string

beforeAll(async () => {
  db = await freshDb()
  ana = await createTenant(db, 'ana')
  bia = await createTenant(db, 'bia')
  anaService = await createService(db, ana)
  biaService = await createService(db, bia)
  await insertAppointment(db, ana, anaService, '2026-10-05T13:00Z', '2026-10-05T14:00Z')
})

afterAll(() => db.end())

const EXCLUSION_VIOLATION = '23P01'

describe('integridade do agendamento', () => {
  it('rejeita serviço de outro tenant', async () => {
    await expect(
      insertAppointment(db, ana, biaService, '2026-11-01T13:00Z', '2026-11-01T14:00Z'),
    ).rejects.toMatchObject({ code: '23503' })
  })
})

describe('exclusion constraint de agendamentos (ADR 0002)', () => {
  it('rejeita agendamento confirmado sobreposto no mesmo tenant', async () => {
    await expect(
      insertAppointment(db, ana, anaService, '2026-10-05T13:30Z', '2026-10-05T14:30Z'),
    ).rejects.toMatchObject({ code: EXCLUSION_VIOLATION })
  })

  it('rejeita agendamento contido dentro de outro', async () => {
    await expect(
      insertAppointment(db, ana, anaService, '2026-10-05T13:15Z', '2026-10-05T13:45Z'),
    ).rejects.toMatchObject({ code: EXCLUSION_VIOLATION })
  })

  it('aceita agendamentos colados (fim de um = início do outro)', async () => {
    await insertAppointment(db, ana, anaService, '2026-10-05T14:00Z', '2026-10-05T15:00Z')
    await insertAppointment(db, ana, anaService, '2026-10-05T12:00Z', '2026-10-05T13:00Z')
  })

  it('aceita o mesmo horário em outro tenant', async () => {
    await insertAppointment(db, bia, biaService, '2026-10-05T13:00Z', '2026-10-05T14:00Z')
  })

  it('não conta agendamento cancelado como ocupado', async () => {
    await insertAppointment(db, ana, anaService, '2026-10-06T13:00Z', '2026-10-06T14:00Z', 'cancelled')
    await insertAppointment(db, ana, anaService, '2026-10-06T13:00Z', '2026-10-06T14:00Z')
  })

  it('libera o horário quando o agendamento é cancelado', async () => {
    await insertAppointment(db, ana, anaService, '2026-10-07T13:00Z', '2026-10-07T14:00Z')
    await db.query(
      `update appointments set status = 'cancelled', cancelled_at = now() where tenant_id = $1 and start_time = '2026-10-07T13:00Z'`,
      [ana],
    )
    await insertAppointment(db, ana, anaService, '2026-10-07T13:00Z', '2026-10-07T14:00Z')
  })

  it('só uma de várias inserções concorrentes no mesmo horário vence', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, async () => {
        const client = await reconnect(db)
        try {
          await insertAppointment(client, ana, anaService, '2026-10-08T13:00Z', '2026-10-08T14:00Z')
        } finally {
          await client.end()
        }
      }),
    )
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    for (const r of results.filter((r) => r.status === 'rejected')) {
      expect((r as PromiseRejectedResult).reason.code).toBe(EXCLUSION_VIOLATION)
    }
  })
})
