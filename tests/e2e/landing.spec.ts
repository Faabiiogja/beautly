import { test, expect } from '@playwright/test'

test('landing abre e os CTAs apontam pros destinos certos', async ({ page, baseURL }) => {
  await page.goto(baseURL!)

  await expect(page.getByRole('heading', { name: /Menos ida e volta pelo WhatsApp/ })).toBeVisible()

  const contactLinks = page.getByRole('link', { name: 'Falar com a gente' })
  await expect(contactLinks.first()).toHaveAttribute('href', /^mailto:contato@beautly\.cloud\?subject=/)

  const enterLinks = page.getByRole('link', { name: 'Entrar' })
  await expect(enterLinks.first()).toHaveAttribute('href', /painel\..*\/login$/)

  // Sem rolagem horizontal.
  const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflowing).toBe(false)
})
