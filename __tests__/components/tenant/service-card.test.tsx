import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ServiceCard } from '@/components/tenant/service-card'

describe('ServiceCard', () => {
  const service = {
    id: '1',
    name: 'Corte Feminino',
    price: 80,
    duration_minutes: 60,
  }

  it('exibe o nome do serviço', () => {
    render(<ServiceCard service={service} />)
    expect(screen.getByText('Corte Feminino')).toBeInTheDocument()
  })

  it('formata o preço como R$ com vírgula decimal', () => {
    render(<ServiceCard service={service} />)
    const priceElement = screen.getByText((content, element) => {
      return element?.textContent === 'R$\u00a080,00'
    })
    expect(priceElement).toBeInTheDocument()
  })

  it('exibe a duração em minutos', () => {
    render(<ServiceCard service={service} />)
    expect(screen.getByText('60 min')).toBeInTheDocument()
  })

  it('formata preço com centavos corretamente', () => {
    render(<ServiceCard service={{ ...service, price: 99.9 }} />)
    const priceElement = screen.getByText((content, element) => {
      return element?.textContent === 'R$\u00a099,90'
    })
    expect(priceElement).toBeInTheDocument()
  })
})
