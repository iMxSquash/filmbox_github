import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // Hors serveur Next, le paquet lève une erreur à l'import : on le neutralise en test.
      'server-only': path.resolve(import.meta.dirname, 'tests/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: loadEnv('test', process.cwd(), ''),
    fileParallelism: false, // les tests d'intégration partagent la même base
  },
})
