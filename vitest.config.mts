import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/db/global-setup.ts'],
    testTimeout: 20000,
  },
})
