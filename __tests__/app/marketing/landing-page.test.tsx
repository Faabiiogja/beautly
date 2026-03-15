import { render, screen } from '@testing-library/react'
import { BeautlyLandingPage } from '@/app/_components/marketing/landing-page'

describe('BeautlyLandingPage', () => {
  it('renderiza o hero e CTAs principais', () => {
    render(<BeautlyLandingPage />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /o sistema de agendamento ideal para clínicas e estúdios de estética/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^começar agora$/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /solicitar demonstração/i })
    ).toBeInTheDocument()
  })

  it('renderiza uma secao de prova social ou features', () => {
    render(<BeautlyLandingPage />)

    expect(
      screen.getByRole('heading', { level: 2, name: /diga adeus à desorganização/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /tudo que você precisa em um só lugar/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /caos no whatsapp/i })).toBeInTheDocument()
    expect(screen.getByText(/painel de controle/i)).toBeInTheDocument()
  })
})
