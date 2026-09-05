import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@starter/contracts': path.resolve(
        import.meta.dirname,
        'packages/contracts/src/index.ts',
      ),
    },
  },
  test: {
    include: [
      'apps/**/*.test.ts',
      'packages/**/*.test.ts',
      'scripts/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
