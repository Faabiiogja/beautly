import type { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { as, createTenant, freshDb } from './helpers'

let db: Client
let ana: string
let bia: string
let off: string

const put = (name: string) => db.query(`insert into storage.objects (bucket_id, name) values ('logos', $1)`, [name])

beforeAll(async () => {
  db = await freshDb()
  ana = await createTenant(db, 'ana')
  bia = await createTenant(db, 'bia')
  off = await createTenant(db, 'inativa', { active: false })
  await db.query(`insert into storage.objects (bucket_id, name) values ('logos', $1), ('logos', $2)`, [`${bia}/logo-1.png`, `${ana}/logo-1.png`])
})

afterAll(() => db.end())

describe('bucket de logos', () => {
  it('existe, é público e restringe tipo e tamanho', async () => {
    const { rows } = await db.query(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'logos'`)
    expect(rows).toEqual([{ public: true, file_size_limit: '1048576', allowed_mime_types: ['image/png', 'image/jpeg', 'image/webp'] }])
  })
})

describe('isolamento por tenant', () => {
  it('a profissional grava na própria pasta', async () => {
    await as(db, 'authenticated', ana, async () => {
      await put(`${ana}/logo-2.png`)
    })
  })

  it('não grava na pasta de outro tenant nem na raiz', async () => {
    await as(db, 'authenticated', ana, async () => {
      await expect(put(`${bia}/logo-2.png`)).rejects.toMatchObject({ code: '42501' })
    })
    await as(db, 'authenticated', ana, async () => {
      await expect(put('logo-solto.png')).rejects.toMatchObject({ code: '42501' })
    })
  })

  it('não vê, substitui nem apaga arquivos de outro tenant', async () => {
    await as(db, 'authenticated', ana, async () => {
      expect((await db.query(`select 1 from storage.objects where name like $1`, [`${bia}/%`])).rowCount).toBe(0)
      expect((await db.query(`update storage.objects set name = $1 where name like $2`, [`${ana}/roubado.png`, `${bia}/%`])).rowCount).toBe(0)
      expect((await db.query(`delete from storage.objects where name like $1`, [`${bia}/%`])).rowCount).toBe(0)
    })
    expect((await db.query(`select 1 from storage.objects where name = $1`, [`${bia}/logo-1.png`])).rowCount).toBe(1)
  })

  it('não move o próprio arquivo para a pasta de outro tenant', async () => {
    await as(db, 'authenticated', ana, async () => {
      await expect(db.query(`update storage.objects set name = $1 where name = $2`, [`${bia}/x.png`, `${ana}/logo-1.png`])).rejects.toMatchObject({ code: '42501' })
    })
  })

  it('apaga o próprio arquivo', async () => {
    await as(db, 'authenticated', ana, async () => {
      expect((await db.query(`delete from storage.objects where name = $1`, [`${ana}/logo-1.png`])).rowCount).toBe(1)
    })
  })

  it('tenant inativo não grava', async () => {
    await as(db, 'authenticated', off, async () => {
      await expect(put(`${off}/logo-1.png`)).rejects.toMatchObject({ code: '42501' })
    })
  })

  it('visitante anônimo não grava', async () => {
    await as(db, 'anon', null, async () => {
      await expect(put(`${ana}/logo-1.png`)).rejects.toMatchObject({ code: '42501' })
    })
  })
})
