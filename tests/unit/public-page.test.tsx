import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { BusinessPage } from '@/components/public/BusinessPage'
import { Unavailable } from '@/components/public/Unavailable'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {} }) }))

const tenant = {
  business_name: 'Studio da Ana',
  logo_url: null,
  phone: '11999999999',
  address: 'Rua das Flores, 10',
  description: 'Manicure e nail art',
}
const services = [
  { id: '1', name: 'Manicure', price_cents: 5000, duration_minutes: 60 },
  { id: '2', name: 'Pedicure', price_cents: 6500, duration_minutes: 90 },
]

const days = [{ day: '2026-09-29', open: true }]

describe('BusinessPage', () => {
  it('mostra os dados do negócio e os serviços', () => {
    const html = renderToStaticMarkup(<BusinessPage tenant={tenant} services={services} days={days} />)
    for (const text of ['Studio da Ana', '(11) 99999-9999', 'Rua das Flores, 10', 'Manicure e nail art', 'Manicure', 'Pedicure', '1h30']) {
      expect(html).toContain(text)
    }
    expect(html).toContain('R$')
  })

  it('omite campos opcionais ausentes', () => {
    const html = renderToStaticMarkup(
      <BusinessPage tenant={{ ...tenant, address: null, description: null }} services={services} days={days} />,
    )
    expect(html).not.toContain('null')
  })

  it('mostra o estado vazio quando não há serviços', () => {
    const html = renderToStaticMarkup(<BusinessPage tenant={tenant} services={[]} days={days} />)
    expect(html).toContain('enhum serviço disponível no momento')
  })
})

describe('Unavailable', () => {
  it('é genérica: não revela nome nem se o tenant existe', () => {
    const html = renderToStaticMarkup(<Unavailable />)
    expect(html).toContain('indisponível')
    expect(html).not.toContain('Studio da Ana')
  })
})
