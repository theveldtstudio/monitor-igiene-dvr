import { defineConfig } from 'vitest/config'

// Test unitari (motori di calcolo DVR): senza il plugin PWA della build.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
