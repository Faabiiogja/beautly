// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          include: [
            '__tests__/super-admin/**/*.test.ts',
            '__tests__/lib/**/*.test.ts',
            '__tests__/booking/**/*.test.ts',
          ],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          include: ['__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
          exclude: [
            '__tests__/super-admin/**',
            '__tests__/lib/**',
            '__tests__/booking/**',
            'node_modules/**',
          ],
          environment: 'jsdom',
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
