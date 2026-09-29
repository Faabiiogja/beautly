import { test, expect } from '@playwright/test'
import { E2E_EMAIL, E2E_PASSWORD } from '../../scripts/e2e-fixtures'

function panelUrl(baseURL: string, path: string): string {
  const url = new URL(baseURL)
  url.hostname = `painel.${url.hostname}`
  url.pathname = path
  return url.toString()
}

test('login com senha errada mostra erro', async ({ page, baseURL }) => {
  await page.goto(panelUrl(baseURL!, '/login'))
  await page.getByLabel('E-mail').fill(E2E_EMAIL)
  await page.getByLabel('Senha', { exact: true }).fill('senha-errada-de-proposito')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('login certo leva a Agendamentos', async ({ page, baseURL }) => {
  await page.goto(panelUrl(baseURL!, '/login'))
  await page.getByLabel('E-mail').fill(E2E_EMAIL)
  await page.getByLabel('Senha', { exact: true }).fill(E2E_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/agendamentos$/)
  await expect(page.getByRole('heading', { name: 'Agendamentos' })).toBeVisible()
})

test('esqueci senha mostra o estado de envio', async ({ page, baseURL }) => {
  await page.goto(panelUrl(baseURL!, '/esqueci-senha'))
  await page.getByLabel('E-mail').fill(E2E_EMAIL)
  await page.getByRole('button', { name: 'Enviar link' }).click()

  await expect(page.getByRole('heading', { name: 'Verifique seu e-mail' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Voltar para o login' })).toBeVisible()
})
