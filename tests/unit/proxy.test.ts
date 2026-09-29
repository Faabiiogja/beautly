import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { proxy } from '@/proxy'

const request = (host: string, path = '/') =>
  new NextRequest(`https://${host}${path}`, { headers: { host } })

const rewrittenTo = (res: Response) => res.headers.get('x-middleware-rewrite')
const redirectedTo = (res: Response) => res.headers.get('location')

describe('proxy', () => {
  it('reescreve o subdomínio de um tenant para a rota interna', async () => {
    const res = await proxy(request('ana.beautly.cloud'))
    expect(new URL(rewrittenTo(res)!).pathname).toBe('/tenant/ana')
  })

  it('preserva o caminho e a query ao reescrever', async () => {
    const res = await proxy(request('ana.beautly.cloud', '/agendamento/abc?x=1'))
    const url = new URL(rewrittenTo(res)!)
    expect(url.pathname).toBe('/tenant/ana/agendamento/abc')
    expect(url.search).toBe('?x=1')
  })

  it('deixa apex e painel passarem sem rewrite', async () => {
    expect(rewrittenTo(await proxy(request('beautly.cloud', '/login')))).toBeNull()
    expect(rewrittenTo(await proxy(request('painel.beautly.cloud', '/agendamentos')))).toBeNull()
  })

  it('bloqueia a rota interna /tenant fora de um subdomínio de tenant', async () => {
    const res = await proxy(request('beautly.cloud', '/tenant/ana'))
    expect(new URL(rewrittenTo(res)!).pathname).toBe('/not-found-tenant-route')
  })

  it('redireciona a raiz do painel para a lista de agendamentos', async () => {
    const res = await proxy(request('painel.beautly.cloud', '/'))
    expect(new URL(redirectedTo(res)!).pathname).toBe('/agendamentos')
  })

  it('não confunde caminhos parecidos com a rota interna', async () => {
    expect(rewrittenTo(await proxy(request('beautly.cloud', '/tenants-x')))).toBeNull()
  })

  it('não permite acessar a rota interna direto pelo caminho num subdomínio', async () => {
    const res = await proxy(request('ana.beautly.cloud', '/tenant/bia'))
    expect(new URL(rewrittenTo(res)!).pathname).toBe('/tenant/ana/tenant/bia')
  })
})
