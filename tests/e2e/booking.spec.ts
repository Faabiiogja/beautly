import { test, expect } from '@playwright/test'
import { E2E_SUBDOMAIN, E2E_ACTIVE_SERVICE_NAMES } from '../../scripts/e2e-fixtures'

function tenantUrl(baseURL: string, subdomain: string): URL {
  const url = new URL(baseURL)
  url.hostname = `${subdomain}.${url.hostname}`
  return url
}

test('agenda do início à confirmação, reabre o link e cancela', async ({ page, baseURL }, testInfo) => {
  await page.goto(tenantUrl(baseURL!, E2E_SUBDOMAIN).toString())

  // Serviço: sempre o primeiro ativo do seed. Nome de string simples (não RegExp): "Corte + escova"
  // tem um "+" que o RegExp interpretaria como quantificador, não como texto literal.
  await page.getByRole('button', { name: E2E_ACTIVE_SERVICE_NAMES[0] }).click()

  // Data: desktop e mobile rodam em paralelo contra o mesmo tenant — cada projeto escolhe um dia
  // diferente pra não disputar o mesmo horário (a constraint de não-sobreposição rejeitaria o segundo).
  const dayIndex = testInfo.project.name === 'mobile' ? 1 : 0
  const dayButtons = page.locator('section[aria-labelledby="datas"] button')
  await expect(dayButtons.nth(dayIndex)).toBeVisible()
  await dayButtons.nth(dayIndex).click()

  // Horário: o primeiro que aparecer.
  const timeButtons = page.locator('section[aria-labelledby="horarios"] button')
  await expect(timeButtons.first()).toBeVisible({ timeout: 10_000 })
  await timeButtons.first().click()

  // Dados da cliente.
  const clientName = `Cliente Playwright ${testInfo.project.name}`
  await page.getByLabel('Seu nome completo').fill(clientName)
  await page.getByLabel('Seu WhatsApp / telefone').fill('11976543210')
  await page.getByRole('button', { name: 'Confirmar agendamento' }).click()

  // Confirmação: nova URL com o token, estado "novo".
  await page.waitForURL(/\/agendamento\/[0-9a-f-]{36}\?novo=1/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: new RegExp(`Tudo certo, ${clientName.split(' ')[0]}`) })).toBeVisible()
  await expect(page.getByText('Confirmado', { exact: true })).toBeVisible()

  // Reabre o link (sem ?novo=1): mesma tela, sem a saudação de "novo".
  const confirmedUrl = page.url()
  const linkWithoutNovo = confirmedUrl.split('?')[0]
  await page.goto(linkWithoutNovo)
  await expect(page.getByRole('heading', { name: 'Seu agendamento' })).toBeVisible()
  await expect(page.getByText('Confirmado', { exact: true })).toBeVisible()

  // Cancela pelo link.
  await page.getByRole('button', { name: 'Cancelar agendamento' }).click()
  await expect(page.getByRole('heading', { name: 'Deseja mesmo cancelar?' })).toBeVisible()
  await page.getByRole('button', { name: 'Sim, cancelar agendamento' }).click()

  await expect(page.getByText('Cancelado', { exact: true })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('link', { name: 'Fazer um novo agendamento' })).toBeVisible()
})

test('subdomínio inexistente mostra a página indisponível', async ({ page, baseURL }) => {
  await page.goto(tenantUrl(baseURL!, 'nao-existe-de-verdade-12345').toString())
  await expect(page.getByRole('heading', { name: 'Página indisponível' })).toBeVisible()
})
