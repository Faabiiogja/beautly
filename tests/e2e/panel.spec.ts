import { test, expect } from '@playwright/test'
import { E2E_EMAIL, E2E_PASSWORD } from '../../scripts/e2e-fixtures'
import { createCancelableAppointment } from './db-fixtures'

function panelUrl(baseURL: string, path: string): string {
  const url = new URL(baseURL)
  url.hostname = `painel.${url.hostname}`
  url.pathname = path
  return url.toString()
}

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(panelUrl(baseURL!, '/login'))
  await page.getByLabel('E-mail').fill(E2E_EMAIL)
  await page.getByLabel('Senha', { exact: true }).fill(E2E_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(/\/agendamentos$/)
})

test('navega entre as 4 áreas do painel', async ({ page }) => {
  await page.getByRole('link', { name: 'Serviços' }).click()
  await expect(page).toHaveURL(/\/servicos$/)
  await expect(page.getByRole('heading', { name: 'Serviços', level: 1 })).toBeVisible()

  await page.getByRole('link', { name: 'Horários' }).click()
  await expect(page).toHaveURL(/\/horarios$/)
  await expect(page.getByRole('heading', { name: 'Horários', level: 1 })).toBeVisible()

  await page.getByRole('link', { name: /Configurações|Ajustes/ }).click()
  await expect(page).toHaveURL(/\/configuracoes$/)
  await expect(page.getByRole('heading', { name: 'Configurações', level: 1 })).toBeVisible()

  await page.getByRole('link', { name: 'Agendamentos' }).click()
  await expect(page).toHaveURL(/\/agendamentos$/)
  await expect(page.getByRole('heading', { name: 'Agendamentos', level: 1 })).toBeVisible()
})

test('cancela um agendamento do seed pelo painel', async ({ page }, testInfo) => {
  // Nome único por projeto (desktop/mobile rodam em paralelo contra o mesmo tenant de staging).
  const clientName = `Cancelar Teste ${testInfo.project.name} ${Date.now()}`
  await createCancelableAppointment(clientName)
  await page.reload()

  await expect(page.getByRole('heading', { name: clientName, level: 3 })).toBeVisible()

  await page.locator(`summary[aria-label="Cancelar agendamento de ${clientName}"]`).click()
  await expect(page.getByRole('heading', { name: `Cancelar o agendamento de ${clientName}?` })).toBeVisible()

  await page.locator('details[open]').getByRole('button', { name: 'Confirmar cancelamento' }).click()

  await expect(page).toHaveURL(/aviso=cancelado/)
  await expect(page.getByText('Agendamento cancelado.')).toBeVisible()
})
