import { test, expect } from '@playwright/test'
import { E2E_SUBDOMAIN, E2E_BUSINESS_NAME, E2E_ACTIVE_SERVICE_NAMES, E2E_INACTIVE_SERVICE_NAME } from '../../scripts/e2e-fixtures'

// Prova a cadeia inteira antes de qualquer tela nova: proxy por subdomínio -> Supabase de staging ->
// página pública do tenant semeado (scripts/e2e-seed.ts), lendo só serviços ativos.
test('página pública do tenant de teste mostra o negócio e só os serviços ativos', async ({ page, baseURL }) => {
  const url = new URL(baseURL!)
  url.hostname = `${E2E_SUBDOMAIN}.${url.hostname}`

  await page.goto(url.toString())

  await expect(page.getByRole('heading', { name: E2E_BUSINESS_NAME })).toBeVisible()
  for (const name of E2E_ACTIVE_SERVICE_NAMES) {
    await expect(page.getByText(name, { exact: true })).toBeVisible()
  }
  await expect(page.getByText(E2E_INACTIVE_SERVICE_NAME)).toHaveCount(0)
})
