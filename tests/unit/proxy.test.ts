import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { proxy } from '@/proxy'

const request = (host: string, path = '/') =>
  new NextRequest(`https://${host}${path}`, { headers: { host } })

const rewrittenTo = (res: Response) => res.headers.get('x-middleware-rewrite')

describe('proxy', () => {
  it('reescreve o subdomínio de um tenant para a rota interna', () => {
    const res = proxy(request('ana.beautly.cloud'))
    expect(new URL(rewrittenTo(res)!).pathname).toBe('/tenant/ana')
  })

  it('preserva o caminho e a query ao reescrever', () => {
    const res = proxy(request('ana.beautly.cloud', '/agendamento/abc?x=1'))
    const url = new URL(rewrittenTo(res)!)
    expect(url.pathname).toBe('/tenant/ana/agendamento/abc')
    expect(url.search).toBe('?x=1')
  })

  it('deixa apex e painel passarem sem rewrite', () => {
    expect(rewrittenTo(proxy(request('beautly.cloud', '/login')))).toBeNull()
    expect(rewrittenTo(proxy(request('painel.beautly.cloud', '/agendamentos')))).toBeNull()
  })

  it('bloqueia a rota interna /tenant fora de um subdomínio de tenant', () => {
    const res = proxy(request('beautly.cloud', '/tenant/ana'))
    expect(new URL(rewrittenTo(res)!).pathname).toBe('/not-found-tenant-route')
  })

  it('não confunde caminhos parecidos com a rota interna', () => {
    expect(rewrittenTo(proxy(request('beautly.cloud', '/tenants-x')))).toBeNull()
  })

  it('não permite acessar a rota interna direto pelo caminho num subdomínio', () => {
    const res = proxy(request('ana.beautly.cloud', '/tenant/bia'))
    expect(new URL(rewrittenTo(res)!).pathname).toBe('/tenant/ana/tenant/bia')
  })
})
