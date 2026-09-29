import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': new URL('.', import.meta.url).pathname } },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    globalSetup: ['tests/db/global-setup.ts'],
    testTimeout: 20000,
  },
})
