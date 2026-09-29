import { randomUUID } from 'node:crypto'
import { Client } from 'pg'

const connect = async (database: string) => {
  const client = new Client({
    host: process.env.TEST_PG_HOST,
    port: Number(process.env.TEST_PG_PORT),
    user: 'postgres',
    database,
  })
  await client.connect()
  return client
}

// Banco novo, clonado do template com shim + migrations aplicados.
export async function freshDb() {
  const admin = await connect('postgres')
  const name = `t_${randomUUID().replaceAll('-', '')}`
  try {
    await admin.query(`create database ${name} template beautly_template`)
  } finally {
    await admin.end()
  }
  return connect(name)
}

// Nova conexão ao mesmo banco de `db` (para simular requisições concorrentes).
export const reconnect = (db: Client) => connect(db.database!)

export type Role = 'anon' | 'authenticated' | 'service_role'

// Roda `fn` como um role do Supabase, opcionalmente logado como `userId` (auth.uid()).
// Tudo dentro de uma transação revertida, para não vazar estado entre asserts.
export async function as<T>(
  db: Client,
  role: Role,
  userId: string | null,
  fn: () => Promise<T>,
): Promise<T> {
  await db.query('begin')
  try {
    await db.query(`set local role ${role}`)
    await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId ?? ''])
    return await fn()
  } finally {
    await db.query('rollback')
  }
}

export async function createTenant(db: Client, subdomain: string, opts: { active?: boolean } = {}) {
  const id = randomUUID()
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${subdomain}@example.com`])
  await db.query(
    `insert into tenants (id, subdomain, business_name, phone, active) values ($1, $2, $3, '11999999999', $4)`,
    [id, subdomain, subdomain, opts.active ?? true],
  )
  return id
}

export async function createService(db: Client, tenantId: string, opts: { active?: boolean } = {}) {
  const { rows } = await db.query(
    `insert into services (tenant_id, name, price_cents, duration_minutes, active)
     values ($1, 'Manicure', 5000, 60, $2) returning id`,
    [tenantId, opts.active ?? true],
  )
  return rows[0].id as string
}

export async function insertAppointment(
  db: Client,
  tenantId: string,
  serviceId: string,
  start: string,
  end: string,
  status: 'confirmed' | 'cancelled' = 'confirmed',
) {
  return db.query(
    `insert into appointments
       (tenant_id, service_id, service_name_snapshot, price_cents_snapshot, duration_minutes_snapshot,
        client_name, client_phone, start_time, end_time, status)
     values ($1, $2, 'Manicure', 5000, 60, 'Maria', '11988888888', $3, $4, $5)`,
    [tenantId, serviceId, start, end, status],
  )
}
