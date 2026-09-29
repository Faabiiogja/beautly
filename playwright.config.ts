import { defineConfig, devices } from '@playwright/test'
import { join } from 'node:path'
import { loadEnvFile } from './scripts/env'

let staging: Record<string, string>
try {
  staging = loadEnvFile(join(__dirname, '.env.e2e.local'))
} catch {
  throw new Error('.env.e2e.local não encontrado — veja README, seção "E2E / Playwright".')
}
const PORT = 3100
const BASE_HOST = 'localhost'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: `http://${BASE_HOST}:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev -- --port 3100',
    url: `http://${BASE_HOST}:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      ...staging,
      NEXT_PUBLIC_ROOT_DOMAIN: BASE_HOST,
      NEXT_PUBLIC_PANEL_URL: `http://painel.${BASE_HOST}:${PORT}`,
    },
  },
})
