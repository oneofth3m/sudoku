/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Puzzle generation loops over up to 25 candidate digs; give them room,
    // especially under v8 coverage instrumentation.
    testTimeout: 60_000,
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/state/**'],
      reporter: ['text', 'html'],
    },
  },
});