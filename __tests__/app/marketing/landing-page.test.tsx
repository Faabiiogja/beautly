import { render, screen } from '@testing-library/react'
import { BeautlyLandingPage } from '@/app/_components/marketing/landing-page'

describe('BeautlyLandingPage', () => {
  it('renderiza o hero e CTAs principais', () => {
    render(<BeautlyLandingPage />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('renderiza uma secao de prova social ou features', () => {
    render(<BeautlyLandingPage />)

    expect(screen.getAllByText(/beautly/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/agendamentos/i).length).toBeGreaterThan(0)
  })
})
